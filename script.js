// ── State ─────────────────────────────────────────────────────────────────
let activeScenario = "ssp126";
let perilMode = "cost";
let timelineChart = null;
let perilChart = null;

// ── Scenario switcher ─────────────────────────────────────────────────────
document.querySelectorAll(".scenario-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    activeScenario = btn.dataset.scenario;
    document.querySelectorAll(".scenario-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updateAll();
  });
});

// ── Peril mode toggle ─────────────────────────────────────────────────────
document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    perilMode = btn.dataset.mode;
    document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updatePerilChart();
  });
});

// ── Update all panels ─────────────────────────────────────────────────────
function updateAll() {
  updateScenarioContext();
  updateKPIs();
  updateTimelineChart();
  updatePerilChart();
  updateMap();
}

// ── Scenario context blurb ────────────────────────────────────────────────
function updateScenarioContext() {
  const s = SCENARIOS[activeScenario];
  const el = document.getElementById("scenario-context");
  el.style.borderColor = s.color;
  el.innerHTML =
    `<span class="ctx-label" style="color:${s.color}">${s.label} &mdash; ${s.warming}</span>` +
    `<span class="ctx-blurb">${s.blurb}</span>`;
}

// ── KPI strip ─────────────────────────────────────────────────────────────
function updateKPIs() {
  const kpi = KPIS[activeScenario];
  const s   = SCENARIOS[activeScenario];

  animateKPI("kpi-increase", `+${kpi.increase2050}%`);
  animateKPI("kpi-peril",    kpi.topPeril);
  animateKPI("kpi-region",   kpi.topRegion);
  document.getElementById("kpi-region-sub").textContent = kpi.topRegionContext;

  document.querySelectorAll(".kpi-card").forEach(card => {
    card.style.borderColor = s.color;
  });
}

function animateKPI(id, value) {
  const el = document.getElementById(id);
  el.classList.remove("animating");
  void el.offsetWidth;
  el.textContent = value;
  el.classList.add("animating");
}

// ── Timeline chart ────────────────────────────────────────────────────────
function updateTimelineChart() {
  const s = SCENARIOS[activeScenario];

  const allYears = [...HISTORICAL.years, ...PROJECTIONS.years];
  const historicalPad = new Array(PROJECTIONS.years.length).fill(null);
  const projectionPad = new Array(HISTORICAL.years.length).fill(null);

  const datasets = [
    {
      label: "Historical",
      data: [...HISTORICAL.total, ...historicalPad],
      borderColor: "#94a3b8",
      backgroundColor: "transparent",
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 4,
      tension: 0.3,
      order: 0,
    },
    {
      label: s.label,
      data: [...projectionPad, ...PROJECTIONS[activeScenario]],
      borderColor: s.color,
      backgroundColor: s.colorBg,
      borderWidth: 2.5,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.4,
      order: 1,
    },
  ];

  const config = {
    type: "line",
    data: { labels: allYears, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 14 },
        },
        tooltip: {
          backgroundColor: "#1e2130",
          borderColor: "#334155",
          borderWidth: 1,
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y ?? "—"} (index)`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#475569",
            font: { size: 10 },
            maxTicksLimit: 13,
          },
          grid: { color: "rgba(255,255,255,0.04)" },
        },
        y: {
          title: {
            display: true,
            text: "Claims index (2024 = 100)",
            color: "#475569",
            font: { size: 10 },
          },
          ticks: { color: "#475569", font: { size: 10 } },
          grid:  { color: "rgba(255,255,255,0.04)" },
        },
      },
    },
  };

  if (timelineChart) {
    timelineChart.data.datasets[1].data        = [...projectionPad, ...PROJECTIONS[activeScenario]];
    timelineChart.data.datasets[1].borderColor = s.color;
    timelineChart.data.datasets[1].backgroundColor = s.colorBg;
    timelineChart.data.datasets[1].label       = s.label;
    timelineChart.options.plugins.legend.labels.color = "#94a3b8";
    timelineChart.update("active");
  } else {
    const ctx = document.getElementById("chart-timeline").getContext("2d");
    timelineChart = new Chart(ctx, config);
  }
}

// ── Peril composition chart ───────────────────────────────────────────────
function updatePerilChart() {
  // For Sprint 2 we'll add scenario-projected peril shift.
  // For now, show historical 2024 baseline peril breakdown as a doughnut.
  const labels = Object.values(PERILS).map(p => p.label);
  const colors = Object.values(PERILS).map(p => p.color);
  const data2024 = Object.keys(PERILS).map(k => HISTORICAL.byPeril[k].at(-1));

  const config = {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: data2024,
        backgroundColor: colors.map(c => c + "cc"),
        borderColor: colors,
        borderWidth: 1.5,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 12, padding: 12 },
        },
        tooltip: {
          backgroundColor: "#1e2130",
          borderColor: "#334155",
          borderWidth: 1,
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed}% of claims`,
          },
        },
      },
      cutout: "62%",
    },
  };

  if (perilChart) {
    perilChart.update();
  } else {
    const ctx = document.getElementById("chart-peril").getContext("2d");
    perilChart = new Chart(ctx, config);
  }
}

// ── Map (Leaflet — placeholder, Sprint 3) ────────────────────────────────
function updateMap() {
  // Map initialisation and choropleth will be implemented in Sprint 3.
  // Region GeoJSON: Stats NZ regional council boundaries (simplified).
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function renderSidebar(region) {
  const s = SCENARIOS[activeScenario];
  const currentRisk = region.currentRisk;
  const futureRisk  = region.risk2050[activeScenario];

  const perilRows = Object.entries(region.perilBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([key, pct]) => {
      const p = PERILS[key];
      return `
        <div class="peril-row">
          <span class="peril-dot" style="background:${p.color}"></span>
          <span class="peril-name">${p.label}</span>
          <div class="peril-bar-wrap">
            <div class="peril-bar" style="width:${pct}%;background:${p.color}"></div>
          </div>
          <span class="peril-pct">${pct}%</span>
        </div>`;
    }).join("");

  document.getElementById("region-sidebar").innerHTML = `
    <h2>Region Detail</h2>
    <p class="sidebar-region-name">${region.name}</p>
    <p class="sidebar-note">${region.note}</p>

    <div class="sidebar-risk">
      <span class="risk-label">Now</span>
      <div class="risk-bar-wrap">
        <div class="risk-bar" style="width:${currentRisk}%;background:#64748b"></div>
      </div>
      <span class="risk-value">${currentRisk}</span>
    </div>
    <div class="sidebar-risk">
      <span class="risk-label">2050</span>
      <div class="risk-bar-wrap">
        <div class="risk-bar" style="width:${futureRisk}%;background:${s.color}"></div>
      </div>
      <span class="risk-value">${futureRisk}</span>
    </div>

    <div class="peril-list">${perilRows}</div>`;
}

// ── Init ──────────────────────────────────────────────────────────────────
updateAll();
