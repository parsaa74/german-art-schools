import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import dynamic from 'next/dynamic'
import { Providers } from './providers'

// Dynamically import the NavBar component to avoid SSR issues
const NavBar = dynamic(() => import('@/components/navigation/NavBar'), {
  ssr: false
})



// Load Inter font using next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'German Art Schools Map',
  description: 'Interactive map of art schools in Germany - Explore the rich artistic education landscape',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121821' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'German Art Schools',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="German Art Schools" />
        <meta name="msapplication-TileColor" content="#121821" />
        <meta name="theme-color" content="#121821" />
      </head>
      <body className="font-inter mobile-text-size-adjust safe-area-inset-top">
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  )
}