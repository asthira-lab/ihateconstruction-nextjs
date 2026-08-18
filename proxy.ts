// Next 16 renamed middleware.ts to proxy.ts. Runs on every non-static request.
// Responsibilities: (1) locale detection & redirect, (2) Clerk auth.

import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "./app/i18n-config";

// Paths that must NOT be locale-prefixed.
const BYPASS = /^\/(api|_next|.*\.[a-zA-Z0-9]+)/;

// Very light Accept-Language parser. Picks the first supported locale, else default.
function detectLocale(req: NextRequest): string {
  const header = req.headers.get("accept-language") ?? "";
  const tags = header
    .split(",")
    .map((s) => (s.split(";")[0] ?? "").trim().toLowerCase());
  for (const tag of tags) {
    const base = tag.split("-")[0] ?? "";
    if ((locales as readonly string[]).includes(base)) return base;
  }
  return defaultLocale;
}

function localeRedirect(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (BYPASS.test(pathname)) return null;
  const hasLocale = (locales as readonly string[]).some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return null;
  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

const withClerk = clerkMiddleware();

export default async function proxy(req: NextRequest, event: Parameters<typeof withClerk>[1]) {
  const redirect = localeRedirect(req);
  if (redirect) return redirect;
  return withClerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
