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

  // Simple optimizations that work with Next.js 14
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  compress: true,
  swcMinify: true,
}

module.exports = nextConfig
