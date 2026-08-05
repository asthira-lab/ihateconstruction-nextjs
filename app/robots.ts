import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

/**
 * robots.txt — served at /robots.txt.
 *
 * Rules:
 *   - Disallow all crawlers from `/api/*` and `/admin/*` (per request).
 *   - Also block private/authenticated routes that leak nothing but waste
 *     crawl budget: /dashboard, /settings, /projects, /login, /register,
 *     password-reset flows, and Next.js internals.
 *   - Known AI scrapers (GPTBot, ClaudeBot, CCBot, etc.) are fully blocked
 *     by default. Public marketing/calculator pages are still opt-in for
 *     Google/Bing/etc. via the wildcard rule. Remove the AI-agent block if
 *     you decide to allow LLM training later.
 *   - Reference the sitemap so crawlers discover it without guessing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/settings/",
          "/projects",
          "/projects/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/_next/",
          "/dev/", // component preview / internal tooling
        ],
      },
      // Block known AI / LLM training crawlers site-wide. Flip these to
      // `allow: "/"` if you decide the marketing surface should be scraped.
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "CCBot",
          "Google-Extended",
          "PerplexityBot",
          "Applebot-Extended",
          "Bytespider",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
