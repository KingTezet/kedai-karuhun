import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/favicon.ico', destination: '/api/brand/icon' },
        { source: '/apple-touch-icon.png', destination: '/api/brand/icon' },
      ],
    }
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
}

export default nextConfig
