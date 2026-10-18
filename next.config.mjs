import { withSentryConfig } from '@sentry/nextjs/config'

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { instrumentationHook: true },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'raw.githubusercontent.com', pathname: '/yuhonas/free-exercise-db/**' }],
  },
}

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: sentryAuthToken,
  silent: !process.env.CI,
  sourcemaps: { disable: !sentryAuthToken },
  telemetry: false,
})
