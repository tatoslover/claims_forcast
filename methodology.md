# NZ Natural Hazard Claims Explorer — Methodology

## Data Sources

All data in the dashboard is **synthetic** — including the historical series. No raw claims data was available. Instead, each source below informed the structure, scale, and calibration of the modelled figures.

| Source | What it provided | Link |
|---|---|---|
| ICNZ — NZ Insurance Statistics | Annual aggregate NZ natural hazard loss totals; used to calibrate the 2024 baseline (index = 100) and the historical growth trend | [icnz.org.nz](https://www.icnz.org.nz/industry-and-data/nz-insurance-statistics/) |
| NIWA — NZ Climate Change Projections | Regional rainfall and temperature change factors by scenario; event frequency context from the NIWA Hazardscape | [niwa.co.nz/climate-change/projections](https://niwa.co.nz/climate-change/projections) |
| IPCC AR6 WG2 Chapter 11 (Australasia) | Per-degree warming multipliers per peril type applied to the forward projections | [ipcc.ch/report/ar6/wg2](https://www.ipcc.ch/report/ar6/wg2/) |
| Stats NZ | Regional population and land use context for exposure weighting | [stats.govt.nz](https://www.stats.govt.nz) |
| NIWA — Cyclone Gabrielle analysis | Event scale and regional impact reference for the 2023 spike in the historical series | [niwa.co.nz/cyclone-gabrielle](https://niwa.co.nz/natural-hazards/ex-tropical-cyclone-gabrielle) |

**On the historical data specifically:** the 2010–2024 series reflects the known shape of NZ natural hazard losses — moderate growth, a Cyclone Gabrielle/Auckland floods spike in 2023, and a return toward trend in 2024. The individual numbers are modelled estimates, not figures quoted directly from ICNZ reports. Real internal claims data would improve precision but would not materially change the relative scenario trajectories.

---

## Tech Stack

- **Chart.js 4.4** — timeline fan chart and peril composition stacked bar; custom canvas plugins for the "Now" vertical rule and Cyclone Gabrielle annotation
- **Leaflet.js 1.9 + NZ GeoJSON** — interactive choropleth map; region click opens a peril breakdown sidebar
- **Vanilla JS** — no build step, no framework; all state managed in plain JS objects
- **CSS custom properties** — dark glass-morphism theme; scenario colours (`--c-126`, `--c-245`, `--c-585`) used consistently across buttons, charts, and map
- **GitHub Pages** — deployed as a single HTML file; no server required

---

## Process

1. **Framing** — chose NZ natural hazard exposure as the topic because it maps directly to IAG's core NZ portfolio and connects climate science to actuarial decisions (pricing, reserving, underwriting)
2. **Data construction** — built synthetic datasets calibrated to ICNZ loss totals; applied NIWA regional factors and IPCC AR6 multipliers to generate three SSP scenario projections per region and peril
3. **Design** — structured around the question a claims analyst would actually ask: *how much, where, and under which scenario?* KPI strip for executives, charts for analysts, map for regional concentration
4. **Interactivity** — scenario selector rerenders all panels simultaneously; peril filters, region drill-down, and a % mix toggle added to support different analytical questions from the same view
5. **Honesty layer** — limitations section in the footer and methodology footnote written proactively; caveats include synthetic data, no earthquake, no exposure growth, and unshown SSP uncertainty bands
