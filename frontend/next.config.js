/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'standalone' for Vercel deployment
  reactStrictMode: false,
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'localhost',
      'your-backend-domain.railway.app',
      'your-domain.com',
      'vercel.app',
      '*.vercel.app'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  },
  // Production optimizations for Vercel
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  swcMinify: true,
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
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
