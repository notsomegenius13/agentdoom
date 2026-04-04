'use client'

import type { FeedSection as FeedSectionType } from '@/lib/feed/types'
import ToolCard from '@/components/tool-card/ToolCard'
import FeaturedToolCard from './FeaturedToolCard'

const SECTION_LABELS: Record<string, { icon: string; accent: string }> = {
  featured: { icon: '★', accent: 'text-amber-400' },
  curated: { icon: '✦', accent: 'text-doom-accent-light' },
  trending: { icon: '🔥', accent: 'text-amber-400' },
  just_shipped: { icon: '🚀', accent: 'text-doom-green' },
  chronological: { icon: '', accent: 'text-gray-300' },
  category: { icon: '', accent: 'text-gray-300' },
}

export default function FeedSection({ section }: { section: FeedSectionType }) {
  if (section.tools.length === 0) return null

  const style = SECTION_LABELS[section.type] || SECTION_LABELS.chronological

  // Featured section uses the special large card
  if (section.type === 'featured' && section.tools[0]) {
    return (
      <section className="space-y-4">
        <h2 className={`text-lg font-semibold ${style.accent}`}>
          <span className="mr-1.5">{style.icon}</span>
          {section.title}
        </h2>
        <FeaturedToolCard tool={section.tools[0]} />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className={`text-lg font-semibold ${style.accent}`}>
        {style.icon && <span className="mr-1.5">{style.icon}</span>}
        {section.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {section.tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  )
}
