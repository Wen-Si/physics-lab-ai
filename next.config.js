/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/physics-lab-ai',
  images: {
    unoptimized: true
  },
  assetPrefix: '/physics-lab-ai'
}

module.exports = nextConfig