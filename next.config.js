/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: process.env.NODE_ENV === 'development' ? '' : '/german-art-schools',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'development' ? '' : '/german-art-schools',
  // Add a publicRuntimeConfig to make basePath available to client components
  publicRuntimeConfig: {
    basePath: process.env.NODE_ENV === 'development' ? '' : '/german-art-schools',
  },
};

module.exports = nextConfig;
