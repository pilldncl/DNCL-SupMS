/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimize webpack configuration to reduce cache warnings
  webpack: (config, { dev, isServer }) => {
    // Optimize cache strategy to reduce large string serialization warnings
    if (dev) {
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        // Limit cache size to prevent warnings
        maxMemoryGenerations: 1,
      }
    }

    // Suppress specific warnings that don't affect functionality
    config.ignoreWarnings = [
      // Suppress webpack cache serialization warnings
      /Serializing big strings/,
      // Suppress source map warnings in development
      /Failed to parse source map/,
    ]

    return config
  },
  
  // Optimize build performance
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
}

module.exports = nextConfig

