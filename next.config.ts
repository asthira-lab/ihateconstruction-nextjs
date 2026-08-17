import type { NextConfig } from "next";

// Legacy calculator slugs → new -calculator slugs. 301 (permanent) so search
// engines transfer link equity from any old URL that got indexed or shared.
const CALCULATOR_REDIRECTS = [
  "cement",
  "brick",
  "concrete",
  "steel",
  "paint",
  "tile",
].map((slug) => ({
  source: `/calculators/${slug}`,
  destination: `/calculators/${slug}-calculator`,
  permanent: true,
}));

const nextConfig: NextConfig = {
  async redirects() {
    return CALCULATOR_REDIRECTS;
  },
};

export default nextConfig;
