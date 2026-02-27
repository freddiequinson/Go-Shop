/** @type {import('next').NextConfig} */
const launchEjsOrigin = process.env.LAUNCH_EJS_ORIGIN || "http://127.0.0.1:3001"

const nextConfig = {
  reactStrictMode: false, // Disable to prevent double mounting
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Required for DigitalOcean standalone deployment
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Allow data URLs (base64 images)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Expose environment variables to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return [
      {
        source: "/launch",
        destination: `${launchEjsOrigin}/`,
      },
      {
        source: "/launch-assets/:path*",
        destination: `${launchEjsOrigin}/:path*`,
      },
    ]
  },
}

export default nextConfig
