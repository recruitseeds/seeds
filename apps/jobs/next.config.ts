/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Add debug info to client-side env
    DEBUG_ENV_VARS: 'true',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  distDir: '.next',
  cleanDistDir: true,
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        console.log('🔧 Next.js Client Environment Check:', {
          NEXT_PUBLIC_USE_TEST_ENDPOINTS: process.env.NEXT_PUBLIC_USE_TEST_ENDPOINTS,
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
          NODE_ENV: process.env.NODE_ENV,
        })
      }
      return config
    },
  }),
}

module.exports = nextConfig
