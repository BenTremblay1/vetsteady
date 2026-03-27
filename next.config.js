/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server components (default in App Router)
  reactStrictMode: true,

  // Image domains for vet clinic logos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
