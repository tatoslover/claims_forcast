# NZ Natural Hazard Claims Explorer

An interactive dashboard visualising how climate change translates into insurance claim exposure across New Zealand — by region, peril type, and warming scenario.

**[View live demo →](https://tatoslover.github.io/claims_forecast/)**

---

## What it does

- Projects NZ natural hazard claims (flood, storm, wildfire, landslide, drought) out to 2070 under three IPCC warming scenarios
- Interactive choropleth map — click any region to see its peril breakdown and risk trajectory
- Scenario comparison table giving a side-by-side actuarial view at 2030, 2040, 2050, and 2070
- Peril composition chart with cost share, event count, and % mix modes
- All panels update simultaneously when switching between scenarios

## Built with

- **Chart.js** — timeline fan chart and stacked bar charts with custom canvas plugins
- **Leaflet.js** — NZ GeoJSON choropleth with region drill-down
- **Vanilla JS / CSS** — no framework, no build step; ships as a single HTML file

## Data

All figures are synthetic, calibrated to publicly available sources:

- [ICNZ](https://www.icnz.org.nz/industry-and-data/nz-insurance-statistics/) — NZ natural hazard aggregate loss statistics
- [NIWA](https://niwa.co.nz/climate-change/projections) — NZ Climate Change Projections and Hazardscape event frequency data
- [IPCC AR6 WG2 Ch11](https://www.ipcc.ch/report/ar6/wg2/) — Australasia climate multipliers per SSP scenario

Figures are for scenario planning only, not pricing or reserving.
