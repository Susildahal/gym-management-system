import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Mongoose (and its native addons) from being bundled by the
  // Next.js / Vercel serverless bundler. Bundling Mongoose breaks its
  // connection-caching singleton and can cause "Cannot find module" errors
  // for native binaries in production.
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
