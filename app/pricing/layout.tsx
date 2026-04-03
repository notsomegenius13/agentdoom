import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'AgentDoom pricing plans. Build tools for free or go Pro for unlimited tools, custom domains, analytics, and premium primitives.',
  openGraph: {
    title: 'Pricing — AgentDoom',
    description:
      'Build tools for free or go Pro for unlimited tools, custom domains, analytics, and premium primitives.',
    url: 'https://agentdoom.ai/pricing',
    siteName: 'AgentDoom',
    type: 'website',
    images: [
      { url: 'https://agentdoom.ai/api/og', width: 1200, height: 630, alt: 'AgentDoom Pricing' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — AgentDoom',
    description:
      'Build tools for free or go Pro for unlimited tools, custom domains, analytics, and premium primitives.',
    images: ['https://agentdoom.ai/api/og'],
  },
  alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
