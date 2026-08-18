// Lazy-loaded per-locale dictionaries. Only runs on the server.
import "server-only";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "../i18n-config";

// English is the source of truth; its shape is the Dictionary type.
import type enDict from "./dictionaries/en.json";
export type Dictionary = typeof enDict;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default as Dictionary),
  es: () => import("./dictionaries/es.json").then((m) => m.default as Dictionary),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default as Dictionary),
  de: () => import("./dictionaries/de.json").then((m) => m.default as Dictionary),
  hi: () => import("./dictionaries/hi.json").then((m) => m.default as Dictionary),
  ar: () => import("./dictionaries/ar.json").then((m) => m.default as Dictionary),
};

// Server-side helper — reads current locale from root params, 404 if unknown.
export async function getDictionary(): Promise<Dictionary> {
  const locale = await lang();
  if (!locale || !isLocale(locale)) notFound();
  return dictionaries[locale]();
}

// When you already have the locale (e.g. inside generateMetadata) — skips root-params.
export async function getDictionaryFor(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
