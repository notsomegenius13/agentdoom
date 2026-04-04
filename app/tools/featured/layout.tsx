import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Featured Tools',
  description: 'Hand-picked and algorithmically selected featured tools on AgentDoom. The best AI-built software, curated daily.',
  alternates: { canonical: '/tools/featured' },
}

export default function FeaturedLayout({ children }: { children: React.ReactNode }) {
  return children
}
