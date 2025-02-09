/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // This replaces next export
  basePath: '/customer_support_ai_agent', // Your actual repository name
  images: {
    unoptimized: true, // Required for static export
  },
  // Required for GitHub Pages
  assetPrefix: process.env.NODE_ENV === 'production' ? '/customer_support_ai_agent' : '',
  trailingSlash: true,
}

module.exports = nextConfig
