import React, { Suspense } from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from '@/components/providers'
import GoogleAnalytics from '@/components/google-analytics'
import { UTMTracker } from '@/components/utm-tracker'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// ... metadata ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <UTMTracker />
          {children}
          <Analytics />
        </Providers>
        <Suspense fallback={null}>
          <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-VC77YKHTSY'} />
        </Suspense>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'MailOS - Intelligent Inbox Management',
  description: 'AI that understands your emails, prioritizes what matters, and sends you daily clarity.',
  generator: 'v0.app',

  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'MailOS - Intelligent Inbox Management',
    description: 'AI that understands your emails, prioritizes what matters, and sends you daily clarity.',
    url: 'https://www.mailos.in/',
    siteName: 'MailOS',
    images: [
      {
        url: 'https://pub-2a4eb4e23d7d4d18bc7ca5d587d38902.r2.dev/landing-page.png',
        width: 1200,
        height: 630,
        alt: 'MailOS Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MailOS - Intelligent Inbox Management',
    description: 'AI that understands your emails, prioritizes what matters, and sends you daily clarity.',
    creator: '@mailos_precizn',
    images: ['https://pub-2a4eb4e23d7d4d18bc7ca5d587d38902.r2.dev/landing-page.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}


