import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppShell from "@/components/AppShell";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bijbelquiz.com'),
  title: {
    default: "BijbelQuiz - Speel Gratis Bijbelquizzen",
    template: "%s | BijbelQuiz",
  },
  description: "Speel gratis Bijbelquizzen en test je kennis van het Oude & Nieuwe Testament. Interactieve vragen, direct feedback, ranglijst en premium studies. Voor jong en oud!",
  keywords: [
    "bijbel quiz", "bijbel quiz online", "gratis bijbel quiz", "bijbel quizzen", "bijbelkennis",
    "bijbel trivia", "christelijke quiz", "bijbel vragen", "bijbelstudie", "online bijbelspel",
    "geloofsquiz", "oude testament quiz", "nieuwe testament quiz", "jezus quiz", "bijbelverhalen",
    "religieuze quiz", "zondagsschool spelletjes", "bijbelteksten leren", "christelijk onderwijs",
    "bijbel challenge", "dagelijkse bijbelvraag", "bijbelstudietools", "kennis van de schrift",
    "bijbelvragen en antwoorden", "moeilijke bijbelvragen", "makkelijke bijbelquiz", "kinderbijbel quiz",
    "bijbel kwis", "christelijke spellen", "bijbel onderwijs", "catechisatie vragen", "bijbelkring materiaal",
    "kennis van god", "profeten quiz", "apostelen quiz", "psalmen quiz", "evangelie quiz",
    "openbaring studie", "schepping quiz", "noach quiz", "mozes vragen", "david en goliath quiz",
    "bijbelse feiten", "christelijk geloof test", "bijbel educatie", "spiritualiteit", "theologie quiz",
    "gereformeerde quiz", "katholieke bijbelquiz", "protestantse bijbelquiz", "evangelische quiz",
    "bijbel apps", "leer de bijbel", "bijbel cursus", "geloofsgroei", "bijbelverdieping",
  ],
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "https://www.bijbelquiz.com",
    title: "BijbelQuiz - Speel Gratis Bijbelquizzen",
    description: "Test je Bijbelkennis met gratis interactieve quizzen. Stijg in de ranglijst, verdien XP en leer meer over Gods Woord. Begin nu!",
    siteName: "BijbelQuiz",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "BijbelQuiz – Gratis Bijbelquizzen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BijbelQuiz - Speel Gratis Bijbelquizzen",
    description: "Test je Bijbelkennis met gratis interactieve quizzen en stijg in de ranglijst!",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon/Logo - dark.svg",
    apple: "/icon/Logo - dark.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BijbelQuiz",
    "url": "https://www.bijbelquiz.com",
    "about": [
      {
        "@type": "Thing",
        "name": "Bijbelstudie",
        "url": "https://www.bijbel-studie.com"
      },
      {
        "@type": "SoftwareApplication",
        "name": "BijbelAPI",
        "url": "https://www.bijbelapi.com"
      }
    ],
    "sameAs": [
      "https://www.bijbel-studie.com",
      "https://www.bijbelapi.com"
    ],
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.bijbelquiz.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BijbelQuiz",
    "url": "https://www.bijbelquiz.com",
    "sameAs": [
      "https://www.bijbel-studie.com",
      "https://www.bijbelapi.com"
    ],
    "knowsAbout": [
      "Bijbelkennis",
      "Bijbelstudie",
      "Digitale Bijbelplatformen"
    ]
  };

  return (
    <html lang="nl" suppressHydrationWarning>
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
        className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-background text-foreground`}
      >
        <GoogleAnalytics />
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
