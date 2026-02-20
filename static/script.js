/* ═══════════════════════════════════════════════
   Disk Scheduling Simulator – Client Logic
   ═══════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── DOM refs ──
  const $requests   = document.getElementById("requests");
  const $head       = document.getElementById("head");
  const $diskSize   = document.getElementById("diskSize");
  const $algorithm  = document.getElementById("algorithm");
  const $btnSim     = document.getElementById("btnSimulate");
  const $btnCompare = document.getElementById("btnCompare");
  const $errorMsg   = document.getElementById("errorMsg");

  const $resultCard = document.getElementById("resultCard");
  const $resultTitle= document.getElementById("resultTitle");
  const $totalSeek  = document.getElementById("totalSeek");
  const $avgSeek    = document.getElementById("avgSeek");
  const $seekSeq    = document.getElementById("seekSequence");

  const $compareCard  = document.getElementById("compareCard");
  const $compareBody  = document.querySelector("#compareTable tbody");

  let seekChart   = null;
  let compareChart = null;

  // ── Helpers ──

  function showError(msg) {
    $errorMsg.textContent = msg;
    setTimeout(() => { $errorMsg.textContent = ""; }, 5000);
  }

  function parseInputs() {
    const raw = $requests.value.trim();
    if (!raw) { showError("Please enter disk requests."); return null; }

    const requests = raw.split(",").map(s => {
      const n = parseInt(s.trim(), 10);
      if (isNaN(n)) throw new Error(`Invalid request value: "${s.trim()}"`);
      return n;
    });

    const head     = parseInt($head.value, 10);
    const diskSize = parseInt($diskSize.value, 10);

    if (isNaN(head))     { showError("Head position must be a number."); return null; }
    if (isNaN(diskSize) || diskSize <= 0) { showError("Disk size must be a positive number."); return null; }
    if (head < 0 || head >= diskSize) { showError(`Head must be between 0 and ${diskSize - 1}.`); return null; }

    for (const r of requests) {
      if (r < 0 || r >= diskSize) {
        showError(`Request ${r} is out of range [0, ${diskSize - 1}].`);
        return null;
      }
    }

    return { requests, head, disk_size: diskSize };
  }

  async function postSimulate(body) {
    const res = await fetch("/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Server error");
    return data;
  }

  // ── Chart builders ──

  function buildSeekChart(canvas, head, sequence, label) {
    const ctx = canvas.getContext("2d");
    if (seekChart) seekChart.destroy();

    const positions = [head, ...sequence];
    const labels    = positions.map((_, i) => i === 0 ? "Start" : `Step ${i}`);

    seekChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: label || "Head Position",
          data: positions,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,.15)",
          pointBackgroundColor: "#22d3ee",
          pointRadius: 5,
          tension: 0.25,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#e2e8f0" } },
          title: { display: true, text: "Head Movement", color: "#e2e8f0", font: { size: 14 } },
        },
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,.06)" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,.06)" }, title: { display: true, text: "Cylinder", color: "#94a3b8" } },
        },
      },
    });
  }

  function buildCompareChart(canvas, results) {
    const ctx = canvas.getContext("2d");
    if (compareChart) compareChart.destroy();

    const names  = Object.keys(results);
    const totals = names.map(n => results[n].total_seek_time);

    const colors = ["#6366f1","#22d3ee","#f59e0b","#ec4899","#34d399","#f87171"];

    compareChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: names,
        datasets: [{
          label: "Total Seek Time",
          data: totals,
          backgroundColor: colors.slice(0, names.length),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#e2e8f0" } },
          title: { display: true, text: "Total Seek Time Comparison", color: "#e2e8f0", font: { size: 14 } },
        },
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,.06)" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,.06)" }, beginAtZero: true, title: { display: true, text: "Seek Time", color: "#94a3b8" } },
        },
      },
    });
  }

  // ── Render helpers ──

  function renderSingleResult(data, algoName, head) {
    $resultCard.classList.remove("hidden");
    $compareCard.classList.add("hidden");
    $resultTitle.textContent = `Result — ${algoName}`;
    $totalSeek.textContent = data.total_seek_time;
    $avgSeek.textContent   = data.average_seek_time;

    $seekSeq.innerHTML = "";
    data.seek_sequence.forEach((pos, i) => {
      const span = document.createElement("span");
      span.className = "step";
      span.textContent = pos;
      span.style.animationDelay = `${i * 0.05}s`;
      $seekSeq.appendChild(span);
    });

    buildSeekChart(document.getElementById("seekChart"), head, data.seek_sequence, algoName);
    $resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCompare(results, head) {
    $compareCard.classList.remove("hidden");
    $resultCard.classList.add("hidden");
    $compareBody.innerHTML = "";

    const bestAlgo = Object.keys(results).reduce((a, b) =>
      results[a].total_seek_time < results[b].total_seek_time ? a : b
    );

    for (const [name, data] of Object.entries(results)) {
      const tr = document.createElement("tr");
      if (name === bestAlgo) tr.className = "best-row";
      tr.innerHTML = `
        <td>${name}${name === bestAlgo ? " ★" : ""}</td>
        <td>${data.total_seek_time}</td>
        <td>${data.average_seek_time}</td>
        <td class="seq-cell">${data.seek_sequence.join(" → ")}</td>
      `;
      $compareBody.appendChild(tr);
    }

    buildCompareChart(document.getElementById("compareChart"), results);
    $compareCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Event Handlers ──

  $btnSim.addEventListener("click", async () => {
    try {
      const inputs = parseInputs();
      if (!inputs) return;

      const algo = $algorithm.value;
      $btnSim.disabled = true;
      $btnSim.textContent = "Simulating…";

      const data = await postSimulate({ ...inputs, algorithm: algo });
      renderSingleResult(data, algo, inputs.head);
    } catch (err) {
      showError(err.message);
    } finally {
      $btnSim.disabled = false;
      $btnSim.innerHTML = "&#9654; Simulate";
    }
  });

  $btnCompare.addEventListener("click", async () => {
    try {
      const inputs = parseInputs();
      if (!inputs) return;

      $btnCompare.disabled = true;
      $btnCompare.textContent = "Comparing…";

      const data = await postSimulate({ ...inputs, algorithm: "ALL" });
      renderCompare(data, inputs.head);
    } catch (err) {
      showError(err.message);
    } finally {
      $btnCompare.disabled = false;
      $btnCompare.innerHTML = "&#128202; Compare All";
    }
  });

})();
