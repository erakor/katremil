import type { Metadata, Viewport } from 'next'
import { Fraunces, IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap' })
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
})
const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Four Thousand Weeks',
  description:
    'A life ledger: see your roughly four thousand weeks, mark the ones behind you, and plan the ones ahead.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">{children}</body>
    </html>
  )
}
