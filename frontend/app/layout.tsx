import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import dynamic from 'next/dynamic'
import './globals.css'
import { Providers } from '@/components/providers'

const GoogleAnalytics = dynamic(() => import('@/components/google-analytics'), { ssr: false })

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'MailOS - Intelligent Inbox Management',
  description: 'AI that understands your emails, prioritizes what matters, and sends you daily clarity.',
  generator: 'v0.app',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
    url: 'https://mail-os.vercel.app',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <Providers>
          {children}
          <Analytics />
        </Providers>
        <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-VC77YKHTSY'} />
      </body>
    </html>
  )
}
