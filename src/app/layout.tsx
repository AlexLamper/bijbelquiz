import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BijbelQuiz - Test & Verdiep je Bijbelkennis Gratis Online",
    template: "%s | BijbelQuiz"
  },
  description: "De #1 plek voor gratis Bijbelquizzen online. Test je kennis van het Oude en Nieuwe Testament, leer spelenderwijs en ontdek diepgaande Bijbelstudies. Geschikt voor jong en oud.",
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
    "bijbelse feiten", "christelijk geloof test", "bijbel educatie", "spirtualiteit", "theologie quiz",
    "gereformeerde quiz", "katholieke bijbelquiz", "protestantse bijbelquiz", "evangelische quiz",
    "bijbel apps", "leer de bijbel", "bijbel cursus", "geloofsgroei", "bijbelverdieping"
  ],
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "https://www.bijbelquiz.com",
    title: "BijbelQuiz - De Beste Online Bijbeltest",
    description: "Doe mee met duizenden anderen en test je kennis van Gods Woord. Gratis quizzen, directe feedback en premium studies.",
    siteName: "BijbelQuiz",
  },
  twitter: {
    card: "summary_large_image",
    title: "BijbelQuiz - Test je Bijbelkennis",
    description: "Speel gratis bijbelquizzen en verrijk je geloofsleven.",
  },
  robots: {
    index: true,
    follow: true,
  }
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
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.bijbelquiz.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="nl">
      <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
      </head>
      <body
        className={`${inter.variable} ${merriweather.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
