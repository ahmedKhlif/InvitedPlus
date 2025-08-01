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
      'invited-plus.vercel.app'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://invitedplus-production.up.railway.app/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'wss://invitedplus-production.up.railway.app',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://invited-plus.vercel.app',
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
            value: "default-src 'self' blob: data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https:; script-src-elem 'self' 'unsafe-inline' blob: data: https:; style-src 'self' 'unsafe-inline' blob: data:; img-src 'self' data: blob: https: res.cloudinary.com; media-src 'self' data: blob: https: res.cloudinary.com mediastream: 'unsafe-inline'; connect-src 'self' https://invitedplus-production.up.railway.app wss://invitedplus-production.up.railway.app http://localhost:3001 ws://localhost:3001 blob: data: https: res.cloudinary.com api.cloudinary.com; font-src 'self' data: blob:; object-src 'self' blob: data:; base-uri 'self'; form-action 'self'; worker-src 'self' blob: data:; child-src 'self' blob: data:; frame-src 'self' blob: data:;",
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
          {
            key: 'Permissions-Policy',
            value: 'microphone=(self "https://invited-plus.vercel.app" "http://localhost:3000"), camera=(self "https://invited-plus.vercel.app" "http://localhost:3000"), geolocation=(self), autoplay=(self)',
          },

        ],
      },
    ];
  },
};

module.exports = nextConfig;
