import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://agentdoom.ai'),
  title: {
    default: 'AgentDoom — Build Software with Words',
    template: '%s — AgentDoom',
  },
  description:
    'The TikTok of AI-built software. Describe any tool, watch it build itself, deploy in seconds.',
  openGraph: {
    title: 'AgentDoom — Build Software with Words',
    description: 'Describe any tool, watch it build itself, deploy in seconds.',
    url: 'https://agentdoom.ai',
    siteName: 'AgentDoom',
    type: 'website',
    images: [
      {
        url: 'https://agentdoom.ai/api/og',
        width: 1200,
        height: 630,
        alt: 'AgentDoom — Build Software with Words',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentDoom — Build Software with Words',
    description: 'Describe any tool, watch it build itself, deploy in seconds.',
    images: ['https://agentdoom.ai/api/og'],
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'AgentDoom',
              url: 'https://agentdoom.ai',
              description:
                'The TikTok of AI-built software. Describe any tool, watch it build itself, deploy in seconds.',
            }),
          }}
        />
      </head>
      <body className={`min-h-screen bg-doom-black text-white antialiased ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
