import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SiteShell } from "@/components/bq/SiteShell";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/next";
import { getSiteConfig, isNlSite } from "@/config/site";
import { getDefaultLocale, t, tList } from "@/i18n";

// The two faces of the 2.0 design: Nunito for all UI text, Fredoka 600 for
// titles. `globals.css` maps them onto `font-sans` and `font-display`.
const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  weight: ["500", "600"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export function generateMetadata(): Metadata {
  const site = getSiteConfig();
  const brand = site.brand;
  return {
    metadataBase: new URL(site.baseUrl),
    title: {
      default: t("meta.titleDefault", { brand }),
      template: t("meta.titleTemplate", { brand }),
    },
    description: t("meta.description"),
    keywords: tList("meta.keywords"),
    openGraph: {
      type: "website",
      locale: t("meta.ogLocale"),
      url: site.baseUrl,
      title: t("meta.ogTitle", { brand }),
      description: t("meta.ogDescription"),
      siteName: brand,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: t("meta.ogImageAlt", { brand }),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.twitterTitle", { brand }),
      description: t("meta.twitterDescription"),
      images: ["/opengraph-image"],
    },
    // The intl build also sends an X-Robots-Tag header (next.config.ts) while
    // SITE_INDEXABLE is not "true"; this keeps the meta tag consistent with it.
    robots: {
      index: site.indexable,
      follow: site.indexable,
      googleBot: {
        index: site.indexable,
        follow: site.indexable,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = getSiteConfig();
  // bijbelstudie.io and bijbelapi.com are Dutch-language sister sites; only the
  // NL site links to them.
  const sisterSites = isNlSite()
    ? ["https://www.bijbelstudie.io", "https://www.bijbelapi.com"]
    : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": site.brand,
    "url": site.baseUrl,
    ...(isNlSite() && {
      "about": [
        {
          "@type": "Thing",
          "name": t("meta.aboutStudieName"),
          "url": "https://www.bijbelstudie.io"
        },
        {
          "@type": "SoftwareApplication",
          "name": "BijbelAPI",
          "url": "https://www.bijbelapi.com"
        }
      ],
      "sameAs": sisterSites,
    }),
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${site.baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": site.brand,
    "url": site.baseUrl,
    ...(isNlSite() && { "sameAs": sisterSites }),
    "knowsAbout": tList("meta.knowsAbout")
  };

  return (
    <html lang={getDefaultLocale()} suppressHydrationWarning>
      <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
      </head>
      <body
        className={`${nunito.variable} ${fredoka.variable} font-sans antialiased bg-canvas text-ink`}
      >
        <GoogleAnalytics />
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
          <Providers>
            <SiteShell>{children}</SiteShell>
          </Providers>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
