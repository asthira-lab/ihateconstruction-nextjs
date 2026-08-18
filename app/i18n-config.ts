// Supported locales. Add new ones here; everything else keys off this list.
export const locales = ["en", "es", "fr", "de", "hi", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// RTL locales — used by root layout to set dir="rtl".
export const rtlLocales: readonly Locale[] = ["ar"] as const;

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  hi: "हिन्दी",
  ar: "العربية",
};

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}
