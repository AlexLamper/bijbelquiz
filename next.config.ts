import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
    },
  },
  transpilePackages: ["@bijbelquiz/database"],
  async redirects() {
    return [
      { source: '/profile', destination: '/profiel', permanent: true },
      { source: '/leaderboard', destination: '/ranglijst', permanent: true },
      { source: '/quizzes', destination: '/quizzen', permanent: true },
      { source: '/quizzes/create', destination: '/quizzen/aanmaken', permanent: true },
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
    ];
  },
  async headers() {
    return [
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
      }
    ]
  }
};

export default nextConfig;
