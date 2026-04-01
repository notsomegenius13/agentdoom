import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentDoom — Build Software with Words',
  description: 'The TikTok of AI-built software. Describe any tool, watch it build itself, deploy in seconds.',
  openGraph: {
    title: 'AgentDoom — Build Software with Words',
    description: 'Describe any tool, watch it build itself, deploy in seconds.',
    url: 'https://agentdoom.ai',
    siteName: 'AgentDoom',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentDoom — Build Software with Words',
    description: 'Describe any tool, watch it build itself, deploy in seconds.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-doom-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}
