// Rebar size reference table — imperial bar size (US) ↔ metric soft size ↔
// nominal diameters. Rendered as a reference table on the page and reused for
// the common bar-diameter options in the form. Pure data, safe to import anywhere.

export interface RebarSize {
  imperial: string;
  metric: string;
  diameterIn: string;
  diameterMm: string;
}

export const REBAR_SIZES: RebarSize[] = [
  { imperial: "#2", metric: "No. 6", diameterIn: "0.250 (1/4)", diameterMm: "6.35" },
  { imperial: "#3", metric: "No. 10", diameterIn: "0.375 (3/8)", diameterMm: "9.525" },
  { imperial: "#4", metric: "No. 13", diameterIn: "0.500 (1/2)", diameterMm: "12.7" },
  { imperial: "#5", metric: "No. 16", diameterIn: "0.625 (5/8)", diameterMm: "15.875" },
  { imperial: "#6", metric: "No. 19", diameterIn: "0.750 (3/4)", diameterMm: "19.05" },
  { imperial: "#7", metric: "No. 22", diameterIn: "0.875 (7/8)", diameterMm: "22.225" },
  { imperial: "#8", metric: "No. 25", diameterIn: "1.000 (8/8)", diameterMm: "25.4" },
  { imperial: "#9", metric: "No. 29", diameterIn: "1.128 (9/8)", diameterMm: "28.65" },
  { imperial: "#10", metric: "No. 32", diameterIn: "1.270 (10/8)", diameterMm: "32.26" },
  { imperial: "#11", metric: "No. 36", diameterIn: "1.410 (11/8)", diameterMm: "35.81" },
  { imperial: "#14", metric: "No. 43", diameterIn: "1.693 (14/8)", diameterMm: "43" },
  { imperial: "#18", metric: "No. 57", diameterIn: "2.257 (18/8)", diameterMm: "57.3" },
];

// Common metric diameters offered in the form's diameter selector.
export const COMMON_DIAMETERS_MM = ["8", "10", "12", "16", "20", "25", "28", "32"] as const;

// Default centre-to-centre spacing by member (mm) — practical field guidance.
export const DEFAULT_SPACING_MM: Record<string, string> = {
  slab: "150",
  footing: "150",
  wall: "200",
  foundation: "150",
};

export const DEFAULT_WASTAGE_PERCENT = "3";
// Bar length delivered by Indian TMT mills; state pipe stock is sold in 12 m bars.
export const DEFAULT_BAR_LENGTH_M = "12";
