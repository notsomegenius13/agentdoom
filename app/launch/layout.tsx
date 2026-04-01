import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AgentDoom Launch — Thursday April 3',
  description:
    'Describe any tool. Watch AI build it in seconds. Deploy instantly. Built by 12 AI agents in 72 hours.',
  openGraph: {
    title: 'AgentDoom Launch — Thursday April 3',
    description: 'Describe any tool. Watch AI build it in seconds. Deploy instantly.',
    url: 'https://agentdoom.ai/launch',
    siteName: 'AgentDoom',
    type: 'website',
    images: [
      {
        url: 'https://agentdoom.ai/api/og',
        width: 1200,
        height: 630,
        alt: 'AgentDoom Launch — Thursday April 3',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentDoom Launch — Thursday April 3',
    description:
      'Describe any tool. Watch AI build it in seconds. Deploy instantly. Built by 12 AI agents in 72 hours.',
    images: ['https://agentdoom.ai/api/og'],
  },
  alternates: {
    canonical: 'https://agentdoom.ai/launch',
  },
};

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
