import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/feed'

const BASE_URL = 'https://agentdoom.ai'

interface Props {
  params: { slug: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getToolBySlug(params.slug)

  if (!tool) {
    return {
      title: 'Tool Not Found — AgentDoom',
      description: 'This tool could not be found on AgentDoom.',
    }
  }

  const title = `${tool.title} — AgentDoom`
  const description =
    tool.description ||
    `${tool.title} — built on AgentDoom. Tap to use, or make your own.`
  const ogImageUrl = `${BASE_URL}/api/og/${params.slug}`
  const toolUrl = `${BASE_URL}/t/${params.slug}`

  return {
    title,
    description,
    openGraph: {
      title: tool.title,
      description,
      url: toolUrl,
      siteName: 'AgentDoom',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: tool.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `/t/${params.slug}`,
    },
    other: {
      'og:image:type': 'image/png',
    },
  }
}

export default async function ToolLayout({ params, children }: Props) {
  const tool = await getToolBySlug(params.slug)

  if (!tool) return <>{children}</>

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.title,
    description: tool.description || `${tool.title} — built on AgentDoom`,
    url: `${BASE_URL}/t/${params.slug}`,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Any',
    ...(tool.isPaid && tool.priceCents > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: (tool.priceCents / 100).toFixed(2),
            priceCurrency: 'USD',
          },
        }
      : {
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        }),
    author: {
      '@type': 'Person',
      name: tool.creator.displayName || tool.creator.username,
      url: `${BASE_URL}/u/${tool.creator.username}`,
    },
    aggregateRating:
      tool.likesCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingCount: tool.likesCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
