import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

/**
 * robots.txt — served at /robots.txt.
 *
 * - Public marketing + calculator pages are fully crawlable.
 * - /api, /admin, and every authenticated route is disallowed (crawl budget
 *   + they leak nothing useful to search).
 * - Google, Bing, Yandex, DuckDuckGo, Baidu are explicitly allowed with
 *   generous image/snippet caps so calculator pages can win rich results.
 * - AI training crawlers are blocked by default — flip to `allow: "/"` if you
 *   decide the marketing surface should be scraped for LLM training.
 */
export default function robots(): MetadataRoute.Robots {
  const authenticatedDisallow = [
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
    "/dev/",
  ];

  return {
    rules: [
      // Default policy for everyone else — allow the marketing surface,
      // block private routes.
      {
        userAgent: "*",
        allow: "/",
        disallow: authenticatedDisallow,
      },
      // Explicit allowlist for the search engines we care about — no extra
      // restrictions beyond the private routes above. Named so Google Search
      // Console shows they're targeted, and so a future stricter `*` rule
      // won't accidentally block them.
      {
        userAgent: [
          "Googlebot",
          "Googlebot-Image",
          "Googlebot-News",
          "Bingbot",
          "DuckDuckBot",
          "Slurp", // Yahoo
          "YandexBot",
          "Baiduspider",
        ],
        allow: "/",
        disallow: authenticatedDisallow,
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
          "cohere-ai",
          "Diffbot",
          "ImagesiftBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
