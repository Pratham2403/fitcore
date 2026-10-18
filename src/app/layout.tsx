import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import MotionProvider from '@/components/ui/MotionProvider'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
})

const SITE_NAME = 'FitCore'
const SITE_DESCRIPTION =
  'Constraint-aware strength training. Build the physique you want without wrecking the joints you have.'
const DEFAULT_SITE_URL = 'http://localhost:3000'
const THEME_COLOR = '#0F0F0F'
/** Vercel serves the analytics script only on its own deployments; elsewhere the request 404s with an HTML page. */
const IS_VERCEL_DEPLOYMENT = process.env.VERCEL === '1'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — constraint-aware strength training`,
    description: SITE_DESCRIPTION,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: THEME_COLOR,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${geistMono.variable} font-sans antialiased bg-bg-primary text-text-primary`}>
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
        {IS_VERCEL_DEPLOYMENT && <Analytics />}
      </body>
    </html>
  )
}
