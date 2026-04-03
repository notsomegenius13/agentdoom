import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feed',
  description:
    'Discover AI-built tools in a TikTok-style feed. Swipe through calculators, generators, dashboards, and more — all built with words.',
  openGraph: {
    title: 'Discover AI-Built Tools — AgentDoom',
    description:
      'Swipe through calculators, generators, dashboards, and more — all built with words.',
    url: 'https://agentdoom.ai/feed',
    siteName: 'AgentDoom',
    type: 'website',
    images: [
      { url: 'https://agentdoom.ai/api/og', width: 1200, height: 630, alt: 'AgentDoom Feed' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover AI-Built Tools — AgentDoom',
    description:
      'Swipe through calculators, generators, dashboards, and more — all built with words.',
    images: ['https://agentdoom.ai/api/og'],
  },
  alternates: { canonical: '/feed' },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
