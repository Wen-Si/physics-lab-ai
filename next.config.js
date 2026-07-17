const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isDev ? {} : { output: 'export' }),
  trailingSlash: true,
  basePath: '/physics-lab-ai',
  images: {
    unoptimized: true
  },
  assetPrefix: '/physics-lab-ai',
  ...(isDev ? {
    async rewrites() {
      return [
        { source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' }
      ];
    },
  } : {}),
};

module.exports = nextConfig