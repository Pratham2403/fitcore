import * as Sentry from '@sentry/nextjs'

const TRACES_SAMPLE_RATE = 0.1
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) Sentry.init({ dsn, tracesSampleRate: TRACES_SAMPLE_RATE })
