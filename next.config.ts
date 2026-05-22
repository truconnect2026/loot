import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /affiliates and /partners consolidated into /kit (2026-05-22).
      // Old SEO juice flows to the unified hub. Founding 20 lives at #founding-20.
      { source: "/affiliates", destination: "/kit", permanent: true },
      { source: "/affiliates/:path*", destination: "/kit", permanent: true },
      { source: "/partners", destination: "/kit#founding-20", permanent: true },
      { source: "/partners/:path*", destination: "/kit#founding-20", permanent: true },
    ];
  },
};

export default nextConfig;
