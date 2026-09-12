import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com'],
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
