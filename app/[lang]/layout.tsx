import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { siteConfig, siteUrl } from "../lib/site";
import { ADSENSE_CLIENT } from "../lib/ads";
import { isLocale, locales, rtlLocales, type Locale } from "../i18n-config";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Pre-render one HTML shell per supported locale at build time.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Metadata is locale-aware — canonical points at the current locale's home,
// and `alternates.languages` emits hreflang tags for every other locale.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "en";
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}`]));
  return {
    metadataBase: new URL(siteUrl),
    title: { default: siteConfig.title, template: `%s — ${siteConfig.shortName}` },
    description: siteConfig.description,
    keywords: [...siteConfig.keywords],
    applicationName: siteConfig.name,
    alternates: { canonical: `/${locale}`, languages: { ...languages, "x-default": "/en" } },
    openGraph: {
      type: "website",
      locale,
      url: `${siteUrl}/${locale}`,
      siteName: siteConfig.shortName,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dir = (rtlLocales as readonly Locale[]).includes(lang as Locale) ? "rtl" : "ltr";
  return (
    <html
      lang={lang}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ClerkProvider dynamic>{children}</ClerkProvider>
      </body>
    </html>
  );
}
