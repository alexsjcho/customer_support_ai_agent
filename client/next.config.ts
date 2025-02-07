/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static exports
  basePath: process.env.NODE_ENV === 'production' ? '/customer_support_ai_agent' : '', // Replace with your repository name
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable server-side features since GitHub Pages is static
  trailingSlash: true,
}

export default nextConfig
