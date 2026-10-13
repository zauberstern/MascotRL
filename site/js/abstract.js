(function () {
  var NAMES = {
    cheetah: "Cheetah",
    fox: "Fox",
    tortoise: "Tortoise",
    magpie: "Magpie",
    hummingbird: "Hummingbird",
    owl: "Owl"
  };
  var COLORS = {
    cheetah: "#1B3A4B",
    fox: "#B03A2E",
    tortoise: "#5B7C8A",
    magpie: "#1B3A4B",
    hummingbird: "#546B78",
    owl: "#7A7A7A"
  };

  function wealth(net) {
    var out = [];
    var level = 1;
    for (var i = 0; i < net.length; i += 1) {
      level *= 1 + net[i];
      out.push(level);
    }
    return out;
  }

  function step(dates) {
    var keep = [];
    for (var i = 0; i < dates.length; i += 8) keep.push(i);
    if (keep[keep.length - 1] !== dates.length - 1) keep.push(dates.length - 1);
    return keep;
  }

  fetch("data/desk_daily_net.json")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      document.querySelectorAll("[data-end]").forEach(function (cell) {
        var key = cell.getAttribute("data-end");
        var series = data.mascots[key];
        if (!series) {
          cell.textContent = "Not on this calendar";
          return;
        }
        var path = wealth(series.net);
        cell.textContent = path[path.length - 1].toFixed(2);
      });
      var idx = step(data.dates);
      var xs = idx.map(function (i) { return data.dates[i]; });
      var traces = [];
      Object.keys(NAMES).forEach(function (key) {
        if (!data.mascots[key]) return;
        var path = wealth(data.mascots[key].net);
        traces.push({
          type: "scatter",
          mode: "lines",
          name: NAMES[key],
          x: xs,
          y: idx.map(function (i) { return path[i]; }),
          line: { color: COLORS[key], width: key === "fox" ? 1.4 : 1, dash: key === "magpie" ? "dot" : key === "hummingbird" ? "dash" : "solid" }
        });
      });
      var peer = wealth(data.benchmarks.equal_weight.net);
      traces.push({
        type: "scatter",
        mode: "lines",
        name: "Equal weight",
        x: xs,
        y: idx.map(function (i) { return peer[i]; }),
        line: { color: "#C4A35A", width: 1.6 }
      });
      Plotly.newPlot("paths", traces, {
        paper_bgcolor: "#FFFFFF",
        plot_bgcolor: "#FFFFFF",
        showlegend: true,
        legend: { orientation: "h", y: -0.2, font: { family: "TeX Gyre Termes, Times New Roman, Times, serif", size: 12, color: "#1B3A4B" } },
        font: { family: "TeX Gyre Termes, Times New Roman, Times, serif", size: 12, color: "#1B3A4B" },
        margin: { l: 48, r: 16, t: 16, b: 64 },
        xaxis: { showgrid: false, zeroline: false, tickfont: { size: 11, color: "#7A7A7A" } },
        yaxis: { title: "One dollar", showgrid: false, zeroline: false, tickformat: ".2f", tickfont: { size: 11, color: "#7A7A7A" } },
        hovermode: "x unified"
      }, { displayModeBar: false, displaylogo: false, responsive: true });
    });
})();
