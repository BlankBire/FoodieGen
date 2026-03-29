import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    return [
      {
        source: '/audio/:path*',
        destination: 'http://localhost:3001/audio/:path*',
      },
    ]
  },
}

export default nextConfig
