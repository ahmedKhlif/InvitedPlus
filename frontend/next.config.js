/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'standalone' for Vercel deployment
  reactStrictMode: false,
  // Remove experimental.appDir as it's now stable in Next.js 15
  images: {
    domains: [
      'localhost',
      'invitedplus-production.up.railway.app',
      'vercel.app',
      'invited-plus-2aeamn7kp-ahmed-khlifs-projects.vercel.app'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://invitedplus-production.up.railway.app/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'wss://invitedplus-production.up.railway.app',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://invited-plus-2aeamn7kp-ahmed-khlifs-projects.vercel.app',
  },
  // Production optimizations for Vercel
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // swcMinify is now default in Next.js 15
  webpack: (config, { isServer }) => {
    // Fix for Konva/canvas issues in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
        fs: false,
      };
    }

    // Exclude canvas from client-side bundle
    config.externals = config.externals || [];
    config.externals.push('canvas');

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://invitedplus-production.up.railway.app/api'}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data:; script-src-elem 'self' 'unsafe-inline' blob: data:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' https://invitedplus-production.up.railway.app wss://invitedplus-production.up.railway.app; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
