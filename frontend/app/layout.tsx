import React, { Suspense } from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from '@/components/providers'
import GoogleAnalytics from '@/components/google-analytics'
import { UTMTracker } from '@/components/utm-tracker'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <UTMTracker />
          {children}
          {/* <Analytics /> */}
        </Providers>
        <Suspense fallback={null}>
          {/* <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-VC77YKHTSY'} /> */}
        </Suspense>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'MailOS — Stop Missing Important Emails in 200+ Daily Messages',
  description: 'Drowning in emails? MailOS detects what matters, groups the rest, and gives you one clean daily summary. Never miss an important email again.',
  generator: 'v0.app',

  icons: {
    icon: '/Logo.jpg',
    apple: '/Logo.jpg',
  },
  openGraph: {
    title: 'MailOS — Stop Missing Important Emails in 200+ Daily Messages',
    description: 'Drowning in emails? MailOS detects what matters, groups the rest, and gives you one clean daily summary. Never miss an important email again.',
    url: 'https://www.mailos.in/',
    siteName: 'MailOS',
    images: [
      {
        url: 'https://pub-2a4eb4e23d7d4d18bc7ca5d587d38902.r2.dev/landing-page-2.png',
        width: 1200,
        height: 630,
        alt: 'MailOS — Inbox clarity on top of Gmail',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MailOS — Stop Missing Important Emails in 200+ Daily Messages',
    description: 'Drowning in emails? MailOS detects what matters, groups the rest, and gives you one clean daily summary. Never miss an important email again.',
    creator: '@mailos_precizn',
    images: ['https://pub-2a4eb4e23d7d4d18bc7ca5d587d38902.r2.dev/landing-page-2.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}


