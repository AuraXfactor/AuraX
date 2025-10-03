import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['firebase'],
  },
  eslint: {
    ignoreDuringBuilds: true, // Allow deployment with ESLint warnings
  },
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript error checking
  },
  // Ensure Google Analytics works with Vercel
  async rewrites() {
    return [];
  },
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self)'}
        ],
      },
    ];
  },
};

export default nextConfig;
