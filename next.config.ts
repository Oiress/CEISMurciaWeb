import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // next-mdx-remote handles MDX at runtime, no webpack MDX loader needed
  serverExternalPackages: ['next-mdx-remote'],
}

export default nextConfig
