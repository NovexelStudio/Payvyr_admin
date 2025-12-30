import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },

  // Compression
  compress: true,

  // Power optimizations
  poweredByHeader: false,
};

export default nextConfig;
