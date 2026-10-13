(function (root) {
  function f32(value) {
    return Math.fround(value);
  }

  function parseTable(text) {
    const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    if (!lines.length) {
      return { error: "The file needs a header with date, instrument_id, and total_return_index." };
    }
    const header = lines[0].split(",").map(function (cell) {
      return cell.trim();
    });
    const dateAt = header.indexOf("date");
    const idAt = header.indexOf("instrument_id");
    const pxAt = header.indexOf("total_return_index");
    if (dateAt < 0 || idAt < 0 || pxAt < 0) {
      return { error: "The file needs a header with date, instrument_id, and total_return_index." };
    }
    const ids = [];
    const idIndex = {};
    const byDate = {};
    const dateOrder = [];
    for (let row = 1; row < lines.length; row += 1) {
      if (!lines[row]) {
        continue;
      }
      const cells = lines[row].split(",");
      const date = cells[dateAt];
      const id = cells[idAt];
      const price = Number(cells[pxAt]);
      if (!date || !id || !Number.isFinite(price) || price <= 0) {
        continue;
      }
      const weekday = new Date(date + "T00:00:00Z").getUTCDay();
      if (weekday === 0 || weekday === 6) {
        continue;
      }
      if (!(date in byDate)) {
        byDate[date] = {};
        dateOrder.push(date);
      }
      if (!(id in idIndex)) {
        idIndex[id] = ids.length;
        ids.push(id);
      }
      byDate[date][id] = price;
    }
    dateOrder.sort();
    const prices = dateOrder.map(function (date) {
      return ids.map(function (id) {
        const value = byDate[date][id];
        return value === undefined ? NaN : value;
      });
    });
    return { ids: ids, dates: dateOrder, prices: prices };
  }

  function rankUnit(values, alive) {
    const idx = [];
    for (let i = 0; i < values.length; i += 1) {
      if (alive[i] && Number.isFinite(values[i])) {
        idx.push(i);
      }
    }
    const out = values.map(function () {
      return 0;
    });
    const n = idx.length;
    if (n === 0) {
      return out;
    }
    if (n === 1) {
      out[idx[0]] = 0;
      return out;
    }
    const order = idx.slice().sort(function (a, b) {
      if (values[a] < values[b]) {
        return -1;
      }
      if (values[a] > values[b]) {
        return 1;
      }
      return a - b;
    });
    let i = 0;
    while (i < n) {
      let j = i + 1;
      while (j < n && values[order[j]] === values[order[i]]) {
        j += 1;
      }
      const avg = 0.5 * (i + (j - 1));
      const mapped = f32(2 * avg / (n - 1) - 1);
      for (let k = i; k < j; k += 1) {
        out[order[k]] = mapped;
      }
      i = j;
    }
    return out;
  }

  function nanstd(window, slot) {
    let count = 0;
    let sum = 0;
    for (let t = 0; t < window.length; t += 1) {
      const value = window[t][slot];
      if (Number.isFinite(value)) {
        count += 1;
        sum += value;
      }
    }
    if (!count) {
      return NaN;
    }
    const mean = sum / count;
    let acc = 0;
    for (let t = 0; t < window.length; t += 1) {
      const value = window[t][slot];
      if (Number.isFinite(value)) {
        const gap = value - mean;
        acc += gap * gap;
      }
    }
    return Math.sqrt(acc / count);
  }

  function featuresAt(prices, t) {
    const k = prices[0].length;
    const finiteCount = new Array(k).fill(0);
    const logP = [];
    for (let time = 0; time <= t; time += 1) {
      const row = [];
      for (let slot = 0; slot < k; slot += 1) {
        const price = prices[time][slot];
        if (Number.isFinite(price) && price > 0) {
          finiteCount[slot] += 1;
          row.push(Math.log(price));
        } else {
          row.push(NaN);
        }
      }
      logP.push(row);
    }
    const alive = finiteCount.map(function (count, slot) {
      return count >= 253 && Number.isFinite(prices[t][slot]);
    });
    const raw = [];
    for (let slot = 0; slot < k; slot += 1) {
      raw.push([NaN, NaN, NaN, NaN, NaN]);
    }
    function ratio(slot, back) {
      const now = prices[t][slot];
      const then = prices[t - back][slot];
      if (!Number.isFinite(now) || !Number.isFinite(then) || then <= 0) {
        return NaN;
      }
      return now / then - 1;
    }
    if (t >= 21) {
      for (let slot = 0; slot < k; slot += 1) {
        raw[slot][0] = ratio(slot, 21);
      }
    }
    if (t >= 63) {
      for (let slot = 0; slot < k; slot += 1) {
        raw[slot][1] = ratio(slot, 63);
      }
    }
    if (t >= 252) {
      for (let slot = 0; slot < k; slot += 1) {
        const left = prices[t - 21][slot];
        const right = prices[t - 252][slot];
        raw[slot][2] = Number.isFinite(left) && Number.isFinite(right) && right > 0 ? left / right - 1 : NaN;
      }
    }
    if (t >= 21) {
      for (let slot = 0; slot < k; slot += 1) {
        const window = [];
        for (let time = t - 20; time <= t; time += 1) {
          window.push([logP[time][slot] - (time ? logP[time - 1][slot] : NaN)]);
        }
        const series = window.map(function (row) {
          return row[0];
        });
        let count = 0;
        let sum = 0;
        for (let i = 0; i < series.length; i += 1) {
          if (Number.isFinite(series[i])) {
            count += 1;
            sum += series[i];
          }
        }
        if (!count) {
          raw[slot][3] = NaN;
        } else {
          const mean = sum / count;
          let acc = 0;
          for (let i = 0; i < series.length; i += 1) {
            if (Number.isFinite(series[i])) {
              acc += (series[i] - mean) * (series[i] - mean);
            }
          }
          raw[slot][3] = Math.sqrt(acc / count);
        }
      }
    }
    if (t >= 63) {
      for (let slot = 0; slot < k; slot += 1) {
        const series = [];
        for (let time = t - 62; time <= t; time += 1) {
          const current = logP[time][slot];
          const previous = time ? logP[time - 1][slot] : NaN;
          series.push(Number.isFinite(current) && Number.isFinite(previous) ? current - previous : NaN);
        }
        let count = 0;
        let sum = 0;
        for (let i = 0; i < series.length; i += 1) {
          if (Number.isFinite(series[i])) {
            count += 1;
            sum += series[i];
          }
        }
        if (!count) {
          raw[slot][4] = NaN;
        } else {
          const mean = sum / count;
          let acc = 0;
          for (let i = 0; i < series.length; i += 1) {
            if (Number.isFinite(series[i])) {
              acc += (series[i] - mean) * (series[i] - mean);
            }
          }
          raw[slot][4] = Math.sqrt(acc / count);
        }
      }
    }
    const ranked = [0, 1, 2, 3, 4].map(function (channel) {
      return rankUnit(raw.map(function (row) {
        return row[channel];
      }), alive);
    });
    const last = [];
    for (let slot = 0; slot < k; slot += 1) {
      last.push(ranked.map(function (column) {
        return f32(column[slot]);
      }));
    }
    return { alive: alive, last: last };
  }

  function sparsemax(values) {
    const sorted = values.slice().sort(function (a, b) {
      return b - a;
    });
    const cumsum = [];
    let running = 0;
    for (let i = 0; i < sorted.length; i += 1) {
      running += sorted[i];
      cumsum.push(running);
    }
    let support = 1;
    for (let k = 1; k <= sorted.length; k += 1) {
      if (1 + k * sorted[k - 1] > cumsum[k - 1]) {
        support = k;
      }
    }
    const tau = (cumsum[support - 1] - 1) / support;
    return values.map(function (value) {
      return Math.max(0, value - tau);
    });
  }

  function topkSparsemax(raw, mask, topk) {
    const n = raw.length;
    const logits = raw.map(function (value, index) {
      return mask[index] ? value : -1e9;
    });
    const sorted = logits.slice().sort(function (a, b) {
      return b - a;
    });
    const k = Math.max(1, Math.min(topk, n));
    const thresh = sorted[k - 1];
    const tied = k < n && thresh === sorted[k];
    const eligible = logits.map(function (value) {
      return tied ? value > thresh : value >= thresh;
    });
    if (eligible.every(function (flag) {
      return !flag;
    })) {
      return { error: "The top 100 cutoff is tied, so this date is refused." };
    }
    const masked = logits.map(function (value, index) {
      return eligible[index] ? value : -1e9;
    });
    let weights = sparsemax(masked).map(function (value, index) {
      return eligible[index] ? value : 0;
    });
    const total = weights.reduce(function (sum, value) {
      return sum + value;
    }, 0);
    if (total > 0) {
      weights = weights.map(function (value) {
        return value / Math.max(total, 1e-12);
      });
    }
    return { weights: weights };
  }

  function tradeBand(target, previous, bOut, bIn) {
    const exec = previous.slice();
    for (let i = 0; i < target.length; i += 1) {
      const gap = target[i] - previous[i];
      if (gap > bOut) {
        exec[i] = Math.min(1, Math.max(0, target[i] - bIn));
      } else if (gap < -bOut) {
        exec[i] = Math.min(1, Math.max(0, target[i] + bIn));
      }
    }
    const free = exec.map(function (value, index) {
      return Math.abs(value - previous[index]) > 1e-15;
    });
    if (free.every(function (flag) {
      return !flag;
    })) {
      return previous.slice();
    }
    let frozenSum = 0;
    let freeSum = 0;
    for (let i = 0; i < exec.length; i += 1) {
      if (free[i]) {
        freeSum += exec[i];
      } else {
        frozenSum += previous[i];
      }
    }
    if (freeSum <= 1e-12) {
      return previous.slice();
    }
    const need = 1 - frozenSum;
    const out = previous.slice();
    for (let i = 0; i < exec.length; i += 1) {
      if (free[i]) {
        out[i] = exec[i] * (need / freeSum);
      }
    }
    return out;
  }

  function logits(last, beta, delta) {
    const slopes = [];
    for (let i = 0; i < 5; i += 1) {
      slopes.push(f32(beta[i + 1]) + f32(delta[i]));
    }
    const intercept = f32(beta[0]);
    return last.map(function (row) {
      let total = intercept;
      for (let i = 0; i < 5; i += 1) {
        total += f32(row[i]) * slopes[i];
      }
      return f32(total);
    });
  }

  function decide(table, ridge, t, previous) {
    if (table.ids.length < 100) {
      return { error: "Fewer than 100 names can be scored on this date." };
    }
    const packed = featuresAt(table.prices, t);
    const aliveCount = packed.alive.filter(Boolean).length;
    if (aliveCount < 100) {
      return { error: "Fewer than 100 names can be scored on this date." };
    }
    const raw = logits(packed.last, ridge.beta, ridge.delta);
    const head = topkSparsemax(raw, packed.alive, 100);
    if (head.error) {
      return head;
    }
    const weights = tradeBand(head.weights, previous, 0.005, 0.002);
    return { weights: weights, alive: packed.alive };
  }

  function walk(table, ridge, end) {
    let previous = table.ids.map(function () {
      return 0;
    });
    let last = null;
    for (let t = 0; t <= end; t += 1) {
      const step = decide(table, ridge, t, previous);
      if (step.error) {
        if (t === end) {
          return step;
        }
        continue;
      }
      previous = step.weights;
      last = step;
    }
    return last || { error: "A name needs 252 prior sessions before this date can be scored." };
  }

  root.MascotScore = {
    parseTable: parseTable,
    walk: walk,
    decide: decide,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
