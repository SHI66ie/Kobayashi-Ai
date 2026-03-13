/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false
      };
    }
    return config;
  },

  // Safe optimizations for Next.js 14
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  compress: true,
  swcMinify: true,

  // Experimental features that are safe for Next.js 14
  experimental: {
    // Enable faster builds with turbo
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Enable powered by header for caching
  poweredByHeader: false,
}

module.exports = nextConfig
