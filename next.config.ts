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
  // Suppress SSR warnings during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
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
