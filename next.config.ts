import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "**.amazon.com",
      },
    ],
  },
  // Enable experimental features if needed
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // External packages for serverless functions (Next.js 16+)
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
