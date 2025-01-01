/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/german-art-schools' : '',
  images: {
    unoptimized: true,
  },
  compiler: {
    styledComponents: true
  }
}

module.exports = nextConfig 