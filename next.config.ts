import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { ROUTE_PAIRS } from "./src/config/route-map";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// See src/config/site.ts. `nl` (bijbelquiz.com) is the default and keeps every
// redirect and header exactly as before; the intl build (biblequizzes.app) gets
// none of the Dutch redirects - `/quizzes` and `/leaderboard` are real pages there.
const isIntlSite = process.env.SITE === "intl";
const intlIndexable = process.env.SITE_INDEXABLE === "true";
// intl only: English is the root site; any other language is its own build served
// under a path prefix (`SITE_LOCALE=es` -> basePath `/es`), proxied from the root project.
const intlLocale = isIntlSite ? (process.env.SITE_LOCALE || "en") : "en";
const intlBasePath = intlLocale === "en" ? undefined : `/${intlLocale}`;

// intl root (English) only: each other language is its own Vercel project with
// basePath `/xx`. Set INTL_PROXY_ES / _PT / _DE / _FR to that project's URL
// (for example https://biblequizzes-es.vercel.app) and the root project forwards
// biblequizzes.app/es/... to it. Unset means no proxy for that language yet.
const intlProxies =
  isIntlSite && intlLocale === "en"
    ? (["es", "pt", "de", "fr"] as const).flatMap((l) => {
        const target = process.env[`INTL_PROXY_${l.toUpperCase()}`]?.replace(/\/$/, "");
        return target
          ? [
              { source: `/${l}`, destination: `${target}/${l}` },
              { source: `/${l}/:path*`, destination: `${target}/${l}/:path*` },
            ]
          : [];
      })
    : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets client components know which site this is (see src/config/site.ts).
  env: { NEXT_PUBLIC_SITE: isIntlSite ? "intl" : "nl", NEXT_PUBLIC_SITE_LOCALE: intlLocale },
  ...(intlBasePath ? { basePath: intlBasePath } : {}),
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
    },
  },
  transpilePackages: ["@bijbelquiz/database"],
  // intl only: the English URLs are served by the Dutch page folders, and a
  // Dutch URL redirects to its English one. NL gets neither.
  async rewrites() {
    if (!isIntlSite) return [];
    return {
      beforeFiles: [...intlProxies, ...ROUTE_PAIRS.map(([nl, en]) => ({ source: en, destination: nl }))],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    if (isIntlSite) {
      return ROUTE_PAIRS.map(([nl, en]) => ({ source: nl, destination: en, permanent: true }));
    }
    return [
      { source: '/profile', destination: '/profiel', permanent: true },
      { source: '/leaderboard', destination: '/ranglijst', permanent: true },
      { source: '/quizzes', destination: '/quizzen', permanent: true },
      // Making your own quiz is gone (admins create quizzes in /beheer); old
      // links to the creator land on the library instead of a 404.
      { source: '/quizzes/create', destination: '/quizzen', permanent: true },
      { source: '/quizzen/aanmaken', destination: '/quizzen', permanent: true },
      { source: '/quiz/:id/review', destination: '/quiz/:id/beoordeling', permanent: true },
      { source: '/login', destination: '/inloggen', permanent: true },
      { source: '/register', destination: '/registreren', permanent: true },
      { source: '/multiplayer', destination: '/samen-spelen', permanent: true },
      { source: '/multiplayer/:roomCode/lobby', destination: '/samen-spelen/:roomCode/lobby', permanent: true },
      { source: '/multiplayer/:roomCode/game', destination: '/samen-spelen/:roomCode/spel', permanent: true },
      { source: '/multiplayer/:roomCode/results', destination: '/samen-spelen/:roomCode/uitslag', permanent: true },
      { source: '/multiplayer/:roomCode', destination: '/samen-spelen/:roomCode', permanent: true },
      { source: '/premium/success', destination: '/premium/succes', permanent: true },
      { source: '/help', destination: '/hulp', permanent: true },
      { source: '/bug-report', destination: '/foutmelding', permanent: true },
      { source: '/privacy-policy', destination: '/privacybeleid', permanent: true },
      { source: '/terms-of-service', destination: '/voorwaarden', permanent: true },
      { source: '/admin', destination: '/beheer', permanent: true },
      { source: '/admin/:path*', destination: '/beheer/:path*', permanent: true },
      // The book is Esther. Ten quizzes were published under the shorter
      // spelling and their slugs went out into search results and shared
      // links, so the old address has to keep resolving.
      {
        source: '/quiz/ester-bijbelquiz-deel-:part',
        destination: '/quiz/esther-bijbelquiz-deel-:part',
        permanent: true,
      },
      {
        source: '/quiz/ester-bijbelquiz-deel-:part/:rest*',
        destination: '/quiz/esther-bijbelquiz-deel-:part/:rest*',
        permanent: true,
      },
    ];
  },
  async headers() {
    // Until launch the intl site must stay out of search engines entirely.
    const intlNoindex = isIntlSite && !intlIndexable
      ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
      : [];
    return [
      ...intlNoindex,
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ]
      },
      {
        // Apple refuses an association file that is not served as JSON, and
        // this one has no extension for Next to infer the type from.
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
        ]
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
        ]
      }
    ]
  }
};

export default nextConfig;
