(function () {
  var ORDER = [
    ["cheetah", "Cheetah", "assets/mascots/cheetah.png"],
    ["fox", "Fox", "assets/mascots/fox.png"],
    ["tortoise", "Tortoise", "assets/mascots/tortoise.png"],
    ["magpie", "Magpie", "assets/mascots/magpie.png"],
    ["hummingbird", "Hummingbird", "assets/mascots/hummingbird.png"],
    ["owl", "Owl", "assets/mascots/owl.png"]
  ];
  var data = null;
  var nets = {};
  var who = null;
  var paint = {};
  var cash = 10000;

  function yearsOf() {
    var years = [];
    data.dates.forEach(function (iso) {
      var year = iso.slice(0, 4);
      if (!years.length || years[years.length - 1] !== year) years.push(year);
    });
    return years;
  }

  function mixReturn(i) {
    var year = data.dates[i].slice(0, 4);
    var key = paint[year];
    if (key && nets[key]) return nets[key][i];
    return data.benchmarks.equal_weight.net[i];
  }

  function wealthPath(pick) {
    var out = [];
    var level = cash;
    var rets = pick === "mix" ? null : data.benchmarks.equal_weight.net;
    for (var i = 0; i < data.dates.length; i += 1) {
      level *= 1 + (rets ? rets[i] : mixReturn(i));
      out.push(level);
    }
    return out;
  }

  function sharpe(pick) {
    var n = data.dates.length;
    var mean = 0;
    var rets = [];
    for (var i = 0; i < n; i += 1) {
      var r = pick === "mix" ? mixReturn(i) : data.benchmarks.equal_weight.net[i];
      rets.push(r);
      mean += r;
    }
    mean /= n;
    var acc = 0;
    rets.forEach(function (r) { var d = r - mean; acc += d * d; });
    var std = Math.sqrt(acc / n);
    if (!std) return "Not defined";
    return (mean / std * Math.sqrt(252)).toFixed(2);
  }

  function money(n) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  function draw() {
    var mix = wealthPath("mix");
    var ew = wealthPath("ew");
    var idx = [];
    for (var i = 0; i < data.dates.length; i += 6) idx.push(i);
    if (idx[idx.length - 1] !== data.dates.length - 1) idx.push(data.dates.length - 1);
    var xs = idx.map(function (i) { return data.dates[i]; });
    var hover = "%{fullData.name}<br>%{x|%-d %B %Y}<br>%{y:$,.2f}<extra></extra>";
    Plotly.react("plot", [
      { type: "scatter", mode: "lines", name: "Even split", x: xs, y: idx.map(function (i) { return ew[i]; }), hovertemplate: hover, line: { color: "#C4A35A", width: 1.4 } },
      { type: "scatter", mode: "lines", name: "Your rota", x: xs, y: idx.map(function (i) { return mix[i]; }), hovertemplate: hover, line: { color: "#1B3A4B", width: 1.6 } }
    ], {
      paper_bgcolor: "#FFFFFF",
      plot_bgcolor: "#FFFFFF",
      showlegend: true,
      legend: { orientation: "h", y: 1.12, font: { family: "TeX Gyre Termes, Times, serif", size: 12, color: "#1B3A4B" } },
      font: { family: "TeX Gyre Termes, Times, serif", size: 12, color: "#1B3A4B" },
      margin: { l: 64, r: 16, t: 36, b: 40 },
      xaxis: { type: "date", showgrid: false, zeroline: false, rangeslider: { visible: true, thickness: 0.12, bgcolor: "#FFFFFF", bordercolor: "#5B7C8A" } },
      yaxis: { title: "Wealth", showgrid: false, zeroline: false, tickprefix: "$", tickformat: ",.0f" },
      hovermode: "x unified",
      uirevision: "desk"
    }, { displayModeBar: false, displaylogo: false, responsive: true });
    document.getElementById("mix-end").textContent = money(mix[mix.length - 1]);
    document.getElementById("ew-end").textContent = money(ew[ew.length - 1]);
    document.getElementById("mix-sh").textContent = sharpe("mix");
    document.getElementById("ew-sh").textContent = sharpe("ew");
    var named = Object.keys(paint).length;
    document.getElementById("state").textContent = named
      ? "Years you named follow that habit. Years you left open keep the even split. Both ending amounts start from the money you typed."
      : "Nothing is staffed yet, so navy and gold are the same line. Pick a habit, then a year.";
  }

  function paintYears() {
    document.querySelectorAll("#years button").forEach(function (button) {
      var year = button.getAttribute("data-year");
      var key = paint[year];
      var row = ORDER.filter(function (item) { return item[0] === key; })[0];
      button.querySelector("small").textContent = row ? row[1] : "Equal weight";
      button.setAttribute("aria-pressed", key ? "true" : "false");
    });
  }

  document.getElementById("cash").addEventListener("input", function (event) {
    var value = Number(event.target.value);
    event.target.classList.toggle("bad", !(value > 0));
    if (value > 0) {
      cash = value;
      if (data) draw();
    }
  });

  fetch("data/desk_daily_net.json").then(function (response) { return response.json(); }).then(function (payload) {
    data = payload;
    ORDER.forEach(function (row) {
      if (data.mascots[row[0]]) nets[row[0]] = data.mascots[row[0]].net;
    });
    var animals = document.getElementById("animals");
    ORDER.forEach(function (row) {
      if (!nets[row[0]]) return;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.setAttribute("aria-pressed", "false");
      button.innerHTML = "<img src=\"" + row[2] + "\" alt=\"\"><span>" + row[1] + "</span>";
      button.addEventListener("click", function () {
        who = row[0];
        animals.querySelectorAll("button").forEach(function (item) {
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        document.getElementById("year-hint").textContent = row[1] + " is in your hand. Click a year to staff it. Click that year again to clear it.";
      });
      animals.appendChild(button);
    });
    var years = document.getElementById("years");
    var list = [];
    data.dates.forEach(function (iso) {
      var year = iso.slice(0, 4);
      if (!list.length || list[list.length - 1] !== year) list.push(year);
    });
    list.forEach(function (year) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "year";
      button.setAttribute("data-year", year);
      button.innerHTML = year + "<small>Equal weight</small>";
      button.addEventListener("click", function () {
        if (!who) {
          document.getElementById("year-hint").textContent = "Pick a habit first, then a year.";
          return;
        }
        if (paint[year] === who) delete paint[year];
        else paint[year] = who;
        paintYears();
        draw();
      });
      years.appendChild(button);
    });
    draw();
  });
})();
