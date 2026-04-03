import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Browse and buy AI-built tools on the AgentDoom marketplace. Find productivity apps, business tools, social utilities, and more.',
  openGraph: {
    title: 'AI-Built Tools Marketplace — AgentDoom',
    description:
      'Browse and buy AI-built tools. Find productivity apps, business tools, social utilities, and more.',
    url: 'https://agentdoom.ai/marketplace',
    siteName: 'AgentDoom',
    type: 'website',
    images: [
      {
        url: 'https://agentdoom.ai/api/og',
        width: 1200,
        height: 630,
        alt: 'AgentDoom Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built Tools Marketplace — AgentDoom',
    description:
      'Browse and buy AI-built tools. Find productivity apps, business tools, social utilities, and more.',
    images: ['https://agentdoom.ai/api/og'],
  },
  alternates: { canonical: '/marketplace' },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
