import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Creators',
  description: 'Top AgentDoom creators and tool builders. See who is building the most popular AI-powered tools.',
  alternates: { canonical: '/creators' },
}

export default function CreatorsLayout({ children }: { children: React.ReactNode }) {
  return children
}
