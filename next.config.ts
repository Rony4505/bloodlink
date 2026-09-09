import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["pg"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/healthcare",
        destination: "/",
        permanent: false,
      },
      {
        source: "/healthcare/:path*",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
