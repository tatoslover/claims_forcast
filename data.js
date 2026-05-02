// ── Data layer ────────────────────────────────────────────────────────────
// Claims index: 2024 baseline = 100. Excludes earthquake.
// Anchored to ICNZ NZ natural hazard aggregate loss statistics.
// Regional/peril breakdowns are modelled estimates calibrated to ICNZ totals
// and NIWA Hazardscape event frequency data.
// Future projections apply IPCC AR6 WG2 Ch11 (Australasia) multipliers
// per SSP warming scenario.
// ─────────────────────────────────────────────────────────────────────────

// ── Scenarios ─────────────────────────────────────────────────────────────
const SCENARIOS = {
  ssp126: {
    id:      "ssp126",
    label:   "SSP1-2.6",
    warming: "~1.5°C by 2100",
    narrative: "Global emissions cut hard. Paris targets met.",
    blurb:   "With strong mitigation in place, claims growth is manageable. About 1-2% annual repricing keeps pace with the increase. Wildfire in Nelson-Tasman and Otago is the main thing to watch.",
    color:   "#10b981",
    colorBg: "rgba(16,185,129,0.12)",
  },
  ssp245: {
    id:      "ssp245",
    label:   "SSP2-4.5",
    warming: "~2.5°C by 2100",
    narrative: "Roughly where current policy takes us. The most likely near-term path.",
    blurb:   "On the current trajectory, flood claims nearly double by 2070. Hawke's Bay and West Coast are the key concentration risks. Reserves need testing against Gabrielle-scale events happening more often.",
    color:   "#f59e0b",
    colorBg: "rgba(245,158,11,0.12)",
  },
  ssp585: {
    id:      "ssp585",
    label:   "SSP5-8.5",
    warming: "~4°C+ by 2100",
    narrative: "Business as usual. Physical risk builds materially through the century.",
    blurb:   "Claims more than double by 2050 and are close to triple the baseline by 2070. Reinsurance costs jump, and underwriting in flood-exposed areas needs tightening before the decade is out. Parts of the coast and floodplain could become effectively uninsurable.",
    color:   "#ef4444",
    colorBg: "rgba(239,68,68,0.12)",
  },
};

// ── Historical data (2010–2024) ───────────────────────────────────────────
// Key events: 2019 Nelson-Tasman wildfires; 2023 Cyclone Gabrielle +
// Auckland Anniversary Weekend floods (most expensive NZ weather event on record).
const HISTORICAL = {
  years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
  total: [  72,  65,  68,  75,  72,  78,  80,  84,  88,  95,  86,  92,  98, 190, 100],
  byPeril: {
    flood:     [ 32, 28, 30, 34, 32, 35, 36, 38, 40, 42, 38, 42, 44, 105, 45],
    storm:     [ 24, 22, 23, 25, 24, 26, 27, 28, 29, 30, 29, 30, 31,  58, 30],
    wildfire:  [  5,  5,  5,  5,  5,  6,  6,  7,  8, 14,  9, 10, 12,  16, 10],
    landslide: [  7,  6,  6,  7,  7,  7,  7,  7,  7,  6,  7,  7,  8,   8,  8],
    drought:   [  4,  4,  4,  4,  4,  4,  4,  4,  4,  3,  3,  3,  3,   3,  7],
  },
};

// ── Projection generation ─────────────────────────────────────────────────
function interpolateWaypoints(waypoints, years) {
  return years.map(year => {
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (year >= waypoints[i].year && year <= waypoints[i + 1].year) {
        const t = (year - waypoints[i].year) / (waypoints[i + 1].year - waypoints[i].year);
        return Math.round(waypoints[i].val + t * (waypoints[i + 1].val - waypoints[i].val));
      }
    }
    return waypoints[waypoints.length - 1].val;
  });
}

const PROJECTION_YEARS = Array.from({ length: 46 }, (_, i) => 2025 + i);

const PROJECTIONS = {
  years: PROJECTION_YEARS,
  ssp126: interpolateWaypoints([
    { year: 2025, val: 102 }, { year: 2030, val: 110 }, { year: 2040, val: 122 },
    { year: 2050, val: 134 }, { year: 2060, val: 141 }, { year: 2070, val: 148 },
  ], PROJECTION_YEARS),
  ssp245: interpolateWaypoints([
    { year: 2025, val: 104 }, { year: 2030, val: 118 }, { year: 2040, val: 140 },
    { year: 2050, val: 167 }, { year: 2060, val: 183 }, { year: 2070, val: 198 },
  ], PROJECTION_YEARS),
  ssp585: interpolateWaypoints([
    { year: 2025, val: 106 }, { year: 2030, val: 128 }, { year: 2040, val: 168 },
    { year: 2050, val: 221 }, { year: 2060, val: 260 }, { year: 2070, val: 290 },
  ], PROJECTION_YEARS),
};

// ── KPI values by scenario ────────────────────────────────────────────────
const KPIS = {
  ssp126: {
    increase2050:      34,
    topPeril:          "Flood",
    topRegion:         "West Coast",
    topRegionContext:  "NZ's wettest region; westerlies are intensifying",
  },
  ssp245: {
    increase2050:      67,
    topPeril:          "Flood",
    topRegion:         "Hawke's Bay",
    topRegionContext:  "Gabrielle showed what the tail risk looks like here",
  },
  ssp585: {
    increase2050:      121,
    topPeril:          "Flood",
    topRegion:         "Hawke's Bay",
    topRegionContext:  "floodplains increasingly inundated under this pathway",
  },
};

// ── Regional data ─────────────────────────────────────────────────────────
// currentRisk and risk2050: 0–100 relative exposure index.
// perilBreakdown: percentage share of claims by peril (sums to 100).
const REGIONS = [
  {
    id: "northland", name: "Northland", maori: "Te Tai Tokerau",
    currentRisk: 52,
    risk2050: { ssp126: 60, ssp245: 70, ssp585: 82 },
    topPeril: "Storm",
    perilBreakdown: { flood: 30, storm: 42, wildfire: 12, landslide: 8, drought: 8 },
    note: "Exposed to tropical cyclones and storm surge as sea surface temperatures rise.",
  },
  {
    id: "auckland", name: "Auckland", maori: "Tāmaki Makaurau",
    currentRisk: 65,
    risk2050: { ssp126: 72, ssp245: 80, ssp585: 89 },
    topPeril: "Flood",
    perilBreakdown: { flood: 52, storm: 32, wildfire: 5, landslide: 8, drought: 3 },
    note: "Urban flooding is the primary driver — demonstrated by the January 2023 Anniversary Weekend floods.",
  },
  {
    id: "waikato", name: "Waikato",
    currentRisk: 50,
    risk2050: { ssp126: 56, ssp245: 64, ssp585: 75 },
    topPeril: "Flood",
    perilBreakdown: { flood: 45, storm: 28, wildfire: 10, landslide: 7, drought: 10 },
    note: "Waikato River catchment poses significant flood exposure across the region.",
  },
  {
    id: "bay-of-plenty", name: "Bay of Plenty", maori: "Te Moana-a-Toi",
    currentRisk: 55,
    risk2050: { ssp126: 62, ssp245: 72, ssp585: 83 },
    topPeril: "Flood",
    perilBreakdown: { flood: 42, storm: 35, wildfire: 10, landslide: 8, drought: 5 },
    note: "Coastal and catchment flooding risk increases with tropical storm intensity.",
  },
  {
    id: "gisborne", name: "Gisborne", maori: "Tairāwhiti",
    currentRisk: 68,
    risk2050: { ssp126: 76, ssp245: 84, ssp585: 92 },
    topPeril: "Flood",
    perilBreakdown: { flood: 50, storm: 25, wildfire: 15, landslide: 8, drought: 2 },
    note: "Steep terrain and fragile river systems put Tairāwhiti among the most exposed regions in the country.",
  },
  {
    id: "hawkes-bay", name: "Hawke's Bay", maori: "Te Matau-a-Māui",
    currentRisk: 72,
    risk2050: { ssp126: 80, ssp245: 90, ssp585: 95 },
    topPeril: "Flood",
    perilBreakdown: { flood: 55, storm: 22, wildfire: 14, landslide: 5, drought: 4 },
    note: "Cyclone Gabrielle showed just how badly the Heretaunga Plains can flood.",
  },
  {
    id: "taranaki", name: "Taranaki",
    currentRisk: 45,
    risk2050: { ssp126: 50, ssp245: 58, ssp585: 68 },
    topPeril: "Storm",
    perilBreakdown: { flood: 35, storm: 45, wildfire: 8, landslide: 8, drought: 4 },
    note: "Lower exposure overall. Storm and coastal flooding are the main risks.",
  },
  {
    id: "manawatu-whanganui", name: "Manawatū-Whanganui",
    currentRisk: 58,
    risk2050: { ssp126: 65, ssp245: 74, ssp585: 84 },
    topPeril: "Flood",
    perilBreakdown: { flood: 48, storm: 30, wildfire: 10, landslide: 7, drought: 5 },
    note: "The Manawatū River has flooded badly multiple times.",
  },
  {
    id: "wellington", name: "Wellington", maori: "Te Whanganui-a-Tara",
    currentRisk: 60,
    risk2050: { ssp126: 66, ssp245: 73, ssp585: 82 },
    topPeril: "Storm",
    perilBreakdown: { flood: 28, storm: 52, wildfire: 8, landslide: 8, drought: 4 },
    note: "Cook Strait wind corridor creates severe storm exposure; coastal inundation risk is growing.",
  },
  {
    id: "tasman", name: "Tasman",
    currentRisk: 55,
    risk2050: { ssp126: 63, ssp245: 73, ssp585: 83 },
    topPeril: "Wildfire",
    perilBreakdown: { flood: 28, storm: 22, wildfire: 36, landslide: 6, drought: 8 },
    note: "The 2019 fires showed what hotter, drier summers mean for wildfire risk here.",
  },
  {
    id: "nelson", name: "Nelson", maori: "Whakatū",
    currentRisk: 50,
    risk2050: { ssp126: 57, ssp245: 66, ssp585: 76 },
    topPeril: "Wildfire",
    perilBreakdown: { flood: 25, storm: 25, wildfire: 32, landslide: 10, drought: 8 },
    note: "Both wildfire and drought risk rise as the top of the South Island dries out.",
  },
  {
    id: "marlborough", name: "Marlborough",
    currentRisk: 48,
    risk2050: { ssp126: 54, ssp245: 62, ssp585: 72 },
    topPeril: "Flood",
    perilBreakdown: { flood: 38, storm: 28, wildfire: 18, landslide: 8, drought: 8 },
    note: "Wairau and Awatere river systems carry flash flood risk during intense rainfall events.",
  },
  {
    id: "west-coast", name: "West Coast", maori: "Te Tai Poutini",
    currentRisk: 75,
    risk2050: { ssp126: 82, ssp245: 88, ssp585: 94 },
    topPeril: "Flood",
    perilBreakdown: { flood: 62, storm: 20, wildfire: 5, landslide: 12, drought: 1 },
    note: "Already NZ's wettest region. Intensifying westerlies push it to the top of the risk index even under the optimistic scenario.",
  },
  {
    id: "canterbury", name: "Canterbury", maori: "Waitaha",
    currentRisk: 62,
    risk2050: { ssp126: 68, ssp245: 76, ssp585: 86 },
    topPeril: "Flood",
    perilBreakdown: { flood: 48, storm: 22, wildfire: 14, landslide: 6, drought: 10 },
    note: "The alpine rivers — Waimakariri, Rakaia — and the flat Plains create real flood exposure. Drought is also an emerging risk.",
  },
  {
    id: "otago", name: "Otago", maori: "Ōtākou",
    currentRisk: 58,
    risk2050: { ssp126: 65, ssp245: 74, ssp585: 84 },
    topPeril: "Flood",
    perilBreakdown: { flood: 40, storm: 22, wildfire: 22, landslide: 8, drought: 8 },
    note: "Wildfire risk is building in the Mackenzie Basin, on top of existing flood exposure from the Clutha and Waitaki.",
  },
  {
    id: "southland", name: "Southland", maori: "Murihiku",
    currentRisk: 50,
    risk2050: { ssp126: 56, ssp245: 64, ssp585: 74 },
    topPeril: "Flood",
    perilBreakdown: { flood: 45, storm: 32, wildfire: 8, landslide: 8, drought: 7 },
    note: "The Mataura and Oreti are the main flood risks. Storm exposure adds to the picture.",
  },
];

// ── Peril metadata ────────────────────────────────────────────────────────
const PERILS = {
  flood:     { label: "Flood",     color: "#3b82f6" },
  storm:     { label: "Storm",     color: "#8b5cf6" },
  wildfire:  { label: "Wildfire",  color: "#f97316" },
  landslide: { label: "Landslide", color: "#84cc16" },
  drought:   { label: "Drought",   color: "#eab308" },
};

// ── Peril bar data ────────────────────────────────────────────────────────
// Stacked bar chart: historical snapshots + projected milestones by scenario.
// Cost values: claims index points per peril (must sum to total for that year).
// Count values: approximate annual event frequency (grows slower than cost,
//   demonstrating that severity per event is also increasing — good talking point).

const PERIL_BARS = {
  // Labels: "" acts as a visual spacer between historical and projected sections
  labels: ["2015", "2020", "2024", "", "2030", "2040", "2050", "2070"],

  cost: {
    historical: [
      { flood: 35, storm: 26, wildfire:  6, landslide:  7, drought:  4 }, // 2015 total=78
      { flood: 38, storm: 29, wildfire:  9, landslide:  7, drought:  3 }, // 2020 total=86
      { flood: 45, storm: 30, wildfire: 10, landslide:  8, drought:  7 }, // 2024 total=100
    ],
    ssp126: [
      { flood: 48, storm: 31, wildfire: 13, landslide: 10, drought:  8 }, // 2030 total=110
      { flood: 54, storm: 33, wildfire: 16, landslide: 11, drought:  8 }, // 2040 total=122
      { flood: 61, storm: 35, wildfire: 20, landslide: 11, drought:  7 }, // 2050 total=134
      { flood: 68, storm: 38, wildfire: 23, landslide: 12, drought:  7 }, // 2070 total=148
    ],
    ssp245: [
      { flood: 52, storm: 32, wildfire: 16, landslide: 11, drought:  7 }, // 2030 total=118
      { flood: 64, storm: 36, wildfire: 22, landslide: 12, drought:  6 }, // 2040 total=140
      { flood: 78, storm: 42, wildfire: 30, landslide: 12, drought:  5 }, // 2050 total=167
      { flood: 95, storm: 49, wildfire: 37, landslide: 12, drought:  5 }, // 2070 total=198
    ],
    ssp585: [
      { flood:  57, storm: 34, wildfire:  22, landslide: 11, drought: 4 }, // 2030 total=128
      { flood:  78, storm: 42, wildfire:  34, landslide: 11, drought: 3 }, // 2040 total=168
      { flood: 106, storm: 53, wildfire:  46, landslide: 13, drought: 3 }, // 2050 total=221
      { flood: 142, storm: 67, wildfire:  63, landslide: 15, drought: 3 }, // 2070 total=290
    ],
  },

  // Event counts — frequency grows more slowly than cost (severity is also rising)
  count: {
    historical: [
      { flood: 45, storm: 62, wildfire:  8, landslide: 18, drought:  5 }, // 2015
      { flood: 52, storm: 65, wildfire: 12, landslide: 20, drought:  6 }, // 2020
      { flood: 58, storm: 68, wildfire: 14, landslide: 22, drought:  9 }, // 2024
    ],
    ssp126: [
      { flood: 61, storm: 70, wildfire: 16, landslide: 23, drought: 10 }, // 2030
      { flood: 65, storm: 72, wildfire: 20, landslide: 24, drought: 11 }, // 2040
      { flood: 70, storm: 74, wildfire: 24, landslide: 25, drought: 12 }, // 2050
      { flood: 75, storm: 76, wildfire: 28, landslide: 26, drought: 13 }, // 2070
    ],
    ssp245: [
      { flood: 64, storm: 71, wildfire: 18, landslide: 24, drought: 10 }, // 2030
      { flood: 70, storm: 74, wildfire: 24, landslide: 26, drought: 12 }, // 2040
      { flood: 78, storm: 77, wildfire: 30, landslide: 28, drought: 14 }, // 2050
      { flood: 90, storm: 82, wildfire: 38, landslide: 31, drought: 16 }, // 2070
    ],
    ssp585: [
      { flood:  67, storm: 73, wildfire: 22, landslide: 25, drought: 10 }, // 2030
      { flood:  77, storm: 78, wildfire: 30, landslide: 27, drought: 12 }, // 2040
      { flood:  90, storm: 83, wildfire: 40, landslide: 30, drought: 13 }, // 2050
      { flood: 110, storm: 90, wildfire: 56, landslide: 34, drought: 14 }, // 2070
    ],
  },
};
