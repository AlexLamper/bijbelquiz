import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // React Strict Mode intentionally double-invokes effects (mount → unmount →
  // remount) in development. For long-lived resources like WebSocket connections
  // this creates an effect-runs-then-cleanup-runs-while-WS-is-CONNECTING cycle.
  // When ws.close() is called on a CONNECTING socket the browser sends a TCP RST
  // instead of a WebSocket close frame — the server observes code 1006 (abnormal).
  // Disabling Strict Mode eliminates the spurious double-invocation in development
  // while keeping all production behaviour identical (Strict Mode never runs in prod).
  reactStrictMode: false,
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
    },
  },
  transpilePackages: ["@bijbelquiz/database"],
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
