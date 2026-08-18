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

// Block search-engine indexing on every non-production host (Vercel preview
// domains, branch deploys, deployment-hash URLs). Production only lives on
// ihateconstruction.co — anywhere else gets X-Robots-Tag: noindex, nofollow
// so Google/Bing drop duplicate rankings for the same content.
const NOINDEX_HEADERS = [
  {
    source: "/:path*",
    has: [{ type: "host" as const, value: "(?<host>.*\\.vercel\\.app)" }],
    headers: [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
    ],
  },
];

const nextConfig: NextConfig = {
  async redirects() {
    return CALCULATOR_REDIRECTS;
  },
  async headers() {
    return NOINDEX_HEADERS;
  },
};

export default nextConfig;
