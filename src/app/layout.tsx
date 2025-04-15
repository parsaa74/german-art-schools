import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import dynamic from 'next/dynamic'

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning className={inter.variable}>
      <head />
      <body className="font-inter">
        <NavBar />
        {children}
      </body>
    </html>
  )
}