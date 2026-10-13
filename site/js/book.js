(function () {
  var ridgeFile = null;
  var pathFile = null;
  var table = null;
  var which = "daily";
  var fileInput = document.getElementById("file");
  var dateInput = document.getElementById("book-date");
  var msg = document.getElementById("book-msg");
  var body = document.querySelector("#weights tbody");

  function setPressed(name) {
    which = name;
    document.getElementById("pick-daily").setAttribute("aria-pressed", name === "daily" ? "true" : "false");
    document.getElementById("pick-monthly").setAttribute("aria-pressed", name === "monthly" ? "true" : "false");
    showBook();
  }

  document.getElementById("pick-daily").addEventListener("click", function () { setPressed("daily"); });
  document.getElementById("pick-monthly").addEventListener("click", function () { setPressed("monthly"); });

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      table = MascotScore.parseTable(String(reader.result));
      if (table.error) {
        msg.textContent = table.error;
        table = null;
        return;
      }
      var first = 0;
      while (first < table.dates.length && first < 252) first += 1;
      dateInput.disabled = false;
      dateInput.min = String(Math.min(first, table.dates.length - 1));
      dateInput.max = String(table.dates.length - 1);
      dateInput.value = dateInput.max;
      msg.textContent = "";
      showBook();
    };
    reader.readAsText(file);
  });

  dateInput.addEventListener("input", showBook);
  document.getElementById("book-prev").addEventListener("click", function () {
    var value = Number(dateInput.value);
    var min = Number(dateInput.min || 0);
    if (value > min) {
      dateInput.value = String(value - 1);
      showBook();
    }
  });
  document.getElementById("book-next").addEventListener("click", function () {
    var value = Number(dateInput.value);
    var max = Number(dateInput.max || 0);
    if (value < max) {
      dateInput.value = String(value + 1);
      showBook();
    }
  });
  document.getElementById("book-cash").addEventListener("input", showBook);

  function showBook() {
    if (!table || !ridgeFile || table.error) return;
    var end = Number(dateInput.value);
    document.getElementById("book-date-label").textContent = humanDate(table.dates[end]);
    var amount = Number(document.getElementById("book-cash").value);
    if (!(amount > 0)) amount = 0;
    var step = MascotScore.walk(table, ridgeFile[which], end);
    if (!step || step.error) {
      msg.textContent = step && step.error ? step.error : "A name needs 252 prior sessions before this date can be scored.";
      body.innerHTML = "";
      document.getElementById("book-summary").textContent = "";
      return;
    }
    msg.textContent = "";
    var rows = step.weights.map(function (weight, index) {
      return { name: table.ids[index], weight: weight };
    }).filter(function (row) {
      return row.weight > 1e-8;
    }).sort(function (a, b) {
      return b.weight - a.weight;
    });
    function esc(text) {
      return String(text).replace(/[&<>"]/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch];
      });
    }
    body.innerHTML = rows.map(function (row) {
      return "<tr><td>" + esc(row.name) + "</td><td class=\"num\">" + row.weight.toFixed(4) + "</td><td class=\"num\">" + (amount > 0 ? (row.weight * amount).toLocaleString("en-US", { style: "currency", currency: "USD" }) : "") + "</td></tr>";
    }).join("");
    var hhi = step.weights.reduce(function (sum, value) { return sum + value * value; }, 0);
    var top = rows[0];
    document.getElementById("book-summary").textContent = amount > 0 && top
      ? "On " + humanDate(table.dates[end]) + ", " + amount.toLocaleString("en-US", { style: "currency", currency: "USD" }) + " is split across " + rows.length + " stocks. The largest piece is " + (top.weight * amount).toLocaleString("en-US", { style: "currency", currency: "USD" }) + " in " + top.name + "."
      : "Type an amount. The page will split it across these stocks.";
  }

  function humanDate(iso) {
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var parts = String(iso).split("-");
    if (parts.length !== 3) return String(iso);
    var month = months[Number(parts[1]) - 1];
    var day = Number(parts[2]);
    if (!month || !day) return String(iso);
    return day + " " + month + " " + parts[0];
  }

  function showStored() {
    if (!pathFile) return;
    var index = Number(document.getElementById("session").value);
    var date = humanDate(pathFile.dates[index]);
    document.getElementById("session-label").textContent = date;
    function line(label, block) {
      var turn = block.one_way_turnover[index];
      return label + " on " + date + " holds " + block.positive[index] + " stocks, leaves " + block.zeros[index] + " at zero, and bunches the money at " + Number(block.hhi[index]).toFixed(4) + ". " + (turn == null ? "This is the first day, so nothing has changed hands yet." : "About " + (Number(turn) * 100).toFixed(1) + " percent of the book changes hands.");
    }
    var empty = pathFile.monthly.positive[index] === 0 ? " The monthly book owns nothing on this day." : "";
    document.getElementById("stored").textContent = line("The daily book", pathFile.daily) + " " + line("The monthly book", pathFile.monthly) + empty;
  }

  document.getElementById("session-prev").addEventListener("click", function () {
    var el = document.getElementById("session");
    var value = Number(el.value);
    if (value > 0) {
      el.value = String(value - 1);
      showStored();
    }
  });
  document.getElementById("session-next").addEventListener("click", function () {
    var el = document.getElementById("session");
    var value = Number(el.value);
    if (pathFile && value < pathFile.dates.length - 1) {
      el.value = String(value + 1);
      showStored();
    }
  });

  Promise.all([
    fetch("data/k400_ridge.json").then(function (response) { return response.json(); }),
    fetch("data/k400_path.json").then(function (response) { return response.json(); })
  ]).then(function (pair) {
    ridgeFile = pair[0];
    pathFile = pair[1];
    var session = document.getElementById("session");
    session.max = String(pathFile.dates.length - 1);
    session.value = session.max;
    var step = Math.max(1, Math.floor(pathFile.dates.length / 400));
    var xs = [];
    var daily = [];
    var monthly = [];
    for (var i = 0; i < pathFile.dates.length; i += step) {
      xs.push(pathFile.dates[i]);
      daily.push(pathFile.daily.hhi[i]);
      monthly.push(pathFile.monthly.hhi[i]);
    }
    if (window.Plotly) {
      Plotly.newPlot("held", [
        { type: "scatter", mode: "lines", name: "Daily book", x: xs, y: daily, line: { color: "#1B3A4B", width: 1.2 } },
        { type: "scatter", mode: "lines", name: "Monthly book", x: xs, y: monthly, line: { color: "#C4A35A", width: 1.2 } }
      ], {
        paper_bgcolor: "#FFFFFF",
        plot_bgcolor: "#FFFFFF",
        showlegend: true,
        legend: { orientation: "h", y: 1.12 },
        font: { family: "TeX Gyre Termes, Times, serif", size: 12, color: "#1B3A4B" },
        margin: { l: 48, r: 12, t: 28, b: 40 },
        xaxis: { showgrid: false, zeroline: false },
        yaxis: { title: "How bunched", showgrid: false, zeroline: false },
        hovermode: "x unified"
      }, { displayModeBar: false, displaylogo: false, responsive: true });
    }
    showStored();
  });
})();
