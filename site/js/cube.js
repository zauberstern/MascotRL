import * as THREE from "./vendor/three.module.js";

const WHO = {
  cheetah: ["Cheetah", "assets/mascots/cheetah.png", "Cheetah drops the stocks that do not make the cut, in a book of 100 names."],
  fox: ["Fox", "assets/mascots/fox.png", "Fox keeps a little of every stock, in a book of 200 names."],
  tortoise: ["Tortoise", "assets/mascots/tortoise.png", "Tortoise can leave a stock at zero, and it can carry a memory from the day before. Book of 200 names."],
  magpie: ["Magpie", "assets/mascots/magpie.png", "Magpie puts almost all the money in one stock."],
  hummingbird: ["Hummingbird", "assets/mascots/hummingbird.png", "Hummingbird caps each hunch, then spreads the money again. Book of 100 names."],
  owl: ["Owl", "assets/mascots/owl.png", "Owl is a book where no habit pulled clearly ahead."]
};

const canvas = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setClearColor(0xffffff, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(canvas.clientWidth || 900, 520, false);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, (canvas.clientWidth || 900) / 520, 0.05, 40);
let yaw = -0.7;
let pitch = 0.45;
let dist = 3.4;
let panX = 0;
let panY = 0;

function placeCamera() {
  camera.position.set(
    dist * Math.cos(pitch) * Math.sin(yaw) + panX,
    dist * Math.sin(pitch) + panY,
    dist * Math.cos(pitch) * Math.cos(yaw)
  );
  camera.lookAt(panX, panY * 0.2, 0);
}

function mix(a, b, t) {
  return (a + (b - a) * t) / 255;
}

function colorOf(value) {
  const z = Math.max(-2, Math.min(2, value));
  const ink = [27, 58, 75];
  const mist = [232, 238, 242];
  const red = [176, 58, 46];
  const pair = z < 0.2 ? [ink, mist, (z + 2) / 2.2] : [mist, red, (z - 0.2) / 1.8];
  if (z >= -0.2 && z < 0.2) return new THREE.Color(mist[0] / 255, mist[1] / 255, mist[2] / 255);
  const t = Math.max(0, Math.min(1, pair[2]));
  return new THREE.Color(mix(pair[0][0], pair[1][0], t), mix(pair[0][1], pair[1][1], t), mix(pair[0][2], pair[1][2], t));
}

let cube = null;
let mesh = null;
let lookup = [];
let tIndex = 0;
let selected = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function build(payload) {
  cube = payload;
  tIndex = cube.dates.length - 1;
  const sessions = cube.values.length;
  const slots = cube.values[0].length;
  const channels = cube.channels.length;
  let count = 0;
  cube.values.forEach(function (plane) {
    plane.forEach(function (row) {
      row.forEach(function (value) { if (value != null) count += 1; });
    });
  });
  const geo = new THREE.BoxGeometry(0.045, 0.07, 0.018);
  const mat = new THREE.MeshBasicMaterial();
  mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  let n = 0;
  lookup = [];
  for (let time = 0; time < sessions; time += 1) {
    for (let slot = 0; slot < slots; slot += 1) {
      for (let channel = 0; channel < channels; channel += 1) {
        const value = cube.values[time][slot][channel];
        if (value == null) continue;
        dummy.position.set((channel / channels - 0.5) * 1.7, (slot / slots - 0.5) * 1.05, (time / sessions - 0.5) * 1.3);
        dummy.updateMatrix();
        mesh.setMatrixAt(n, dummy.matrix);
        mesh.setColorAt(n, colorOf(value));
        lookup.push([time, slot, channel]);
        n += 1;
      }
    }
  }
  mesh.count = n;
  scene.add(mesh);
  const width = canvas.clientWidth || 627;
  renderer.setSize(width, 520, false);
  camera.aspect = width / 520;
  camera.updateProjectionMatrix();
  function shift(step) {
    tIndex = Math.max(0, Math.min(cube.dates.length - 1, tIndex + step));
    showDate();
    render();
  }
  document.getElementById("prev-day").addEventListener("click", function () { shift(-1); });
  document.getElementById("next-day").addEventListener("click", function () { shift(1); });
  showDate();
  render();
}

function prose(iso) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const parts = iso.split("-");
  return Number(parts[2]) + " " + months[Number(parts[1]) - 1] + " " + parts[0];
}
function showDate() {
  document.getElementById("when-label").textContent = prose(cube.dates[tIndex]);
}

const SAY = {
  log_ret_1: "its move on the last trading day is {tone} compared with the other names",
  log_ret_5: "its moves over the past week add up to a {tone} total",
  log_ret_21: "its moves over the past month add up to a {tone} total",
  log_ret_63: "its moves over the past three months add up to a {tone} total",
  log_ret_126: "its moves over the past six months add up to a {tone} total",
  log_ret_252: "its moves over the past year add up to a {tone} total",
  price_rel_1: "its percent change on the last trading day is {tone}",
  price_rel_5: "its percent change since a week ago is {tone}",
  price_rel_21: "its percent change since a month ago is {tone}",
  price_rel_63: "its percent change since three months ago is {tone}",
  price_rel_126: "its percent change since six months ago is {tone}",
  price_rel_252: "its percent change since a year ago is {tone}",
  mom_12_1: "its gain from about a year ago up to a month ago is {tone}",
  hv_21: "its day-to-day swings over the past month are {tone}",
  hv_63: "its day-to-day swings over the past three months are {tone}",
  hv_252: "its day-to-day swings over the past year are {tone}",
  vol_of_vol: "the size of its daily swings has been changing at a {tone} pace",
  amihud: "its price move per dollar traded over the past month is {tone}",
  adv_dollar_volume: "its typical daily dollar trading over the past month is {tone}",
  iv_skew_30d: "one-month options that pay off if it falls carry a {tone} extra cost",
  iv_term_slope: "its one-year options price a {tone} amount of extra movement versus the one-month options",
  mfiv_30: "the full set of one-month options prices a {tone} amount of movement",
  w_prev: "its existing share of the book coming into the day is {tone}",
  days_held: "it has been held on the same side for a {tone} number of days",
  cum_cost: "it has built up a {tone} trading cost so far",
  w_base: "its slice of the equal-weight basket is {tone}"
};
function sentence(time, slot, channel) {
  const name = cube.channels[channel];
  const date = prose(cube.dates[time]);
  const value = cube.values[time][slot][channel];
  const who = "Name " + (slot + 1);
  if (value == null) {
    document.getElementById("plain").textContent = "On " + date + ", " + who + " has no reading yet. The window behind it is not filled.";
    return;
  }
  const tone = value > 0.15 ? "high" : value < -0.15 ? "low" : "ordinary";
  const bit = (SAY[name] || "its reading is {tone}").replace("{tone}", tone);
  document.getElementById("plain").textContent = "On " + date + ", " + who + " " + bit + ". The number against the other names that day is " + Number(value).toFixed(2) + ". Only the previous day was visible.";
}

function render() {
  placeCamera();
  renderer.render(scene, camera);
}

const picks = document.getElementById("who");
Object.keys(WHO).forEach(function (key) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.innerHTML = "<img src=\"" + WHO[key][1] + "\" alt=\"\"><span>" + WHO[key][0] + "</span>";
  button.setAttribute("aria-pressed", key === "cheetah" ? "true" : "false");
  button.addEventListener("click", function () {
    document.getElementById("caption").textContent = WHO[key][2];
    picks.querySelectorAll("button").forEach(function (item) {
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });
  });
  picks.appendChild(button);
});

let drag = null;
canvas.addEventListener("pointerdown", function (event) {
  drag = { x: event.clientX, y: event.clientY, yaw: yaw, pitch: pitch, panX: panX, panY: panY, shift: event.shiftKey };
});
canvas.addEventListener("pointermove", function (event) {
  if (!drag) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (drag.shift) {
    panX = drag.panX + dx / 180;
    panY = drag.panY - dy / 180;
  } else {
    yaw = drag.yaw + dx * 0.008;
    pitch = Math.max(0.15, Math.min(1.2, drag.pitch + dy * 0.005));
  }
  render();
});
canvas.addEventListener("pointerup", function () { drag = null; });
canvas.addEventListener("wheel", function (event) {
  event.preventDefault();
  dist = Math.max(1.2, Math.min(8, dist * (event.deltaY > 0 ? 1.08 : 0.92)));
  render();
}, { passive: false });
canvas.addEventListener("click", function (event) {
  if (!mesh) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(mesh)[0];
  if (!hit) return;
  const found = lookup[hit.instanceId];
  selected = found;
  tIndex = found[0];
  showDate();
  sentence(found[0], found[1], found[2]);
  const gold = new THREE.Color(196 / 255, 163 / 255, 90 / 255);
  mesh.setColorAt(hit.instanceId, gold);
  mesh.instanceColor.needsUpdate = true;
  render();
});

fetch("data/cube_illustrative.json").then(function (response) { return response.json(); }).then(build);
render();
