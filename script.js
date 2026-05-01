// ── State ─────────────────────────────────────────────────────────────────
let activeScenario = "ssp126";
let perilMode      = "cost";
let activePerils   = new Set(Object.keys(PERILS));
let timelineChart  = null;
let perilChart     = null;
let leafletMap     = null;
let geojsonLayer   = null;

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

// ── "Now" line plugin ─────────────────────────────────────────────────────
const nowLinePlugin = {
  id: "nowLine",
  afterDraw(chart) {
    if (!chart.config.options._showNowLine) return;
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
    const xPos = x.getPixelForValue(2024);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(xPos, top);
    ctx.lineTo(xPos, bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Now", xPos + 5, top + 14);
    ctx.restore();
  },
};
Chart.register(nowLinePlugin);

// ── Timeline chart ────────────────────────────────────────────────────────
// Shows historical (solid grey) + all three scenario projections simultaneously.
// Active scenario: full colour + fill. Inactive: muted, thin, no fill.
function buildTimelineDatasets() {
  const ALL_YEARS = [...HISTORICAL.years, ...PROJECTION_YEARS];

  const historicalDataset = {
    label: "Historical",
    data: ALL_YEARS.map(y => {
      const i = HISTORICAL.years.indexOf(y);
      return i !== -1 ? HISTORICAL.total[i] : null;
    }),
    borderColor: "#94a3b8",
    backgroundColor: "transparent",
    borderWidth: 2,
    pointRadius: ALL_YEARS.map(y => y === 2023 ? 5 : 0),
    pointHoverRadius: ALL_YEARS.map(y => y === 2023 ? 7 : 4),
    pointBackgroundColor: ALL_YEARS.map(y => y === 2023 ? "#ef4444" : "#94a3b8"),
    tension: 0.3,
    fill: false,
    order: 0,
  };

  const scenarioDatasets = Object.values(SCENARIOS).map(s => {
    const isActive = s.id === activeScenario;
    return {
      label: s.label,
      _scenarioId: s.id,
      data: ALL_YEARS.map(y => {
        if (y === 2024) return 100; // bridge point
        const i = PROJECTION_YEARS.indexOf(y);
        return i !== -1 ? PROJECTIONS[s.id][i] : null;
      }),
      borderColor: isActive ? s.color : s.color + "44",
      backgroundColor: isActive ? s.colorBg : "transparent",
      borderWidth: isActive ? 2.5 : 1,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.4,
      fill: isActive ? "origin" : false,
      order: isActive ? 1 : 2,
    };
  });

  return { labels: ALL_YEARS, datasets: [historicalDataset, ...scenarioDatasets] };
}

function updateTimelineChart() {
  const { labels, datasets } = buildTimelineDatasets();

  const tooltipConfig = {
    backgroundColor: "#1e2130",
    borderColor: "#334155",
    borderWidth: 1,
    titleColor: "#e2e8f0",
    bodyColor: "#94a3b8",
    callbacks: {
      title: items => {
        const year = items[0].label;
        return year === "2023" ? `${year} — Cyclone Gabrielle + Auckland floods` : String(year);
      },
      label: ctx => {
        const v = ctx.parsed.y;
        if (v == null) return null;
        return ` ${ctx.dataset.label}: ${v} (index)`;
      },
    },
  };

  if (timelineChart) {
    // Update scenario dataset styles without destroying the chart
    timelineChart.data.datasets.forEach(ds => {
      if (!ds._scenarioId) return;
      const s = SCENARIOS[ds._scenarioId];
      const isActive = ds._scenarioId === activeScenario;
      ds.borderColor       = isActive ? s.color : s.color + "44";
      ds.backgroundColor   = isActive ? s.colorBg : "transparent";
      ds.borderWidth       = isActive ? 2.5 : 1;
      ds.fill              = isActive ? "origin" : false;
      ds.order             = isActive ? 1 : 2;
    });
    timelineChart.update("active");
  } else {
    const ctx = document.getElementById("chart-timeline").getContext("2d");
    timelineChart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        _showNowLine: true,
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "#64748b", font: { size: 11 }, boxWidth: 14, padding: 12 },
          },
          tooltip: tooltipConfig,
        },
        scales: {
          x: {
            ticks: { color: "#475569", font: { size: 10 }, maxTicksLimit: 13 },
            grid:  { color: "rgba(255,255,255,0.04)" },
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
            min: 0,
          },
        },
      },
    });
  }
}

// ── Peril composition chart ───────────────────────────────────────────────
// Stacked bar: historical snapshots (2015, 2020, 2024) + projected milestones
// under the active scenario (2030, 2040, 2050, 2070). Visual spacer between them.
// Toggle: cost index vs event count — counts grow slower, showing severity increase.
function buildPerilBarDatasets() {
  const modeData = PERIL_BARS[perilMode];
  const projected = modeData[activeScenario];

  // 8 bars: 3 historical + spacer + 4 projected
  const rows = [
    ...modeData.historical,
    null, // spacer
    ...projected,
  ];

  return Object.entries(PERILS).filter(([key]) => activePerils.has(key)).map(([key, meta]) => ({
    label: meta.label,
    data: rows.map(r => r ? r[key] : null),
    backgroundColor: meta.color + "cc",
    borderColor: meta.color,
    borderWidth: 1,
    borderRadius: 3,
    hoverBackgroundColor: meta.color,
  }));
}

function updatePerilChart() {
  const datasets = buildPerilBarDatasets();
  const yLabel = perilMode === "cost"
    ? "Claims index (2024 = 100)"
    : "Annual event count";

  if (perilChart) {
    perilChart.data.datasets.forEach((ds, i) => {
      ds.data = datasets[i].data;
      ds.backgroundColor = datasets[i].backgroundColor;
      ds.borderColor     = datasets[i].borderColor;
    });
    perilChart.options.scales.y.title.text = yLabel;
    perilChart.update("active");
  } else {
    const ctx = document.getElementById("chart-peril").getContext("2d");
    perilChart = new Chart(ctx, {
      type: "bar",
      data: { labels: PERIL_BARS.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "#64748b", font: { size: 11 }, boxWidth: 12, padding: 10 },
          },
          tooltip: {
            backgroundColor: "#1e2130",
            borderColor: "#334155",
            borderWidth: 1,
            titleColor: "#e2e8f0",
            bodyColor: "#94a3b8",
            callbacks: {
              title: items => {
                const label = items[0].label;
                if (!label) return "—";
                const isProjected = ["2030","2040","2050","2070"].includes(label);
                return isProjected
                  ? `${label} — ${SCENARIOS[activeScenario].label} projection`
                  : `${label} — historical`;
              },
              label: ctx => {
                const v = ctx.parsed.y;
                if (v == null) return null;
                const unit = perilMode === "cost" ? " (index)" : " events";
                return ` ${ctx.dataset.label}: ${v}${unit}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: "#475569", font: { size: 10 } },
            grid: { display: false },
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: yLabel,
              color: "#475569",
              font: { size: 10 },
            },
            ticks: { color: "#475569", font: { size: 10 } },
            grid: { color: "rgba(255,255,255,0.04)" },
            min: 0,
          },
        },
      },
    });
  }
}

// ── Peril filter ──────────────────────────────────────────────────────────
function buildPerilFilters() {
  const container = document.getElementById("peril-filters");
  if (!container) return;
  container.innerHTML = Object.entries(PERILS).map(([key, meta]) => `
    <label class="peril-filter-label">
      <input type="checkbox" class="peril-checkbox" data-peril="${key}" checked>
      <span class="peril-filter-dot" style="background:${meta.color}"></span>
      ${meta.label}
    </label>
  `).join("");

  container.querySelectorAll(".peril-checkbox").forEach(cb => {
    cb.addEventListener("change", () => {
      if (cb.checked) activePerils.add(cb.dataset.peril);
      else activePerils.delete(cb.dataset.peril);
      updatePerilChart();
      updateTimelineChart();
    });
  });
}

// ── Map ───────────────────────────────────────────────────────────────────
function riskColor(score) {
  if (score >= 88) return "#ef4444";
  if (score >= 78) return "#f97316";
  if (score >= 68) return "#f59e0b";
  if (score >= 58) return "#eab308";
  return "#84cc16";
}

function regionStyle(feature) {
  const region = REGIONS.find(r => r.id === feature.properties.id);
  const score  = region ? region.risk2050[activeScenario] : 40;
  return {
    fillColor:   riskColor(score),
    fillOpacity: 0.65,
    color:       "#1e2130",
    weight:      1.5,
  };
}

function onEachFeature(feature, layer) {
  const region = REGIONS.find(r => r.id === feature.properties.id);
  if (!region) return;

  layer.on({
    mouseover(e) {
      e.target.setStyle({ fillOpacity: 0.85, weight: 2.5, color: "#e2e8f0" });
      e.target.bringToFront();
    },
    mouseout(e) {
      geojsonLayer.resetStyle(e.target);
    },
    click() {
      renderSidebar(region);
    },
  });

  const score = region.risk2050[activeScenario];
  const maoriLine = region.maori ? `<span style="color:#94a3b8;font-style:italic"> ${region.maori}</span><br>` : "";
  layer.bindTooltip(
    `<strong>${region.name}</strong><br>${maoriLine}2050 risk index: ${score}`,
    { sticky: true, className: "map-tooltip" }
  );
}

function updateMap() {
  if (!leafletMap) {
    leafletMap = L.map("map", {
      center: [-41.5, 173.5],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 10,
    }).addTo(leafletMap);

    fetch("nz-regions.geojson")
      .then(r => r.json())
      .then(data => {
        geojsonLayer = L.geoJSON(data, {
          style: regionStyle,
          onEachFeature,
        }).addTo(leafletMap);
        leafletMap.fitBounds(geojsonLayer.getBounds(), { padding: [16, 16], maxZoom: 7 });
      });
  } else if (geojsonLayer) {
    geojsonLayer.setStyle(regionStyle);
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function renderSidebar(region) {
  const s           = SCENARIOS[activeScenario];
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
    ${region.maori ? `<p class="sidebar-region-maori">${region.maori}</p>` : ""}
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
buildPerilFilters();
updateAll();
