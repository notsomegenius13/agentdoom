'use client'

import React from 'react'

export interface CardItem {
  title: string
  description: string
  icon?: string
  tag?: string
  link?: string
}

export interface CardGridConfig {
  title: string
  cards: CardItem[]
  columns?: number
}

export default function CardGrid({ config }: { config: CardGridConfig }) {
  const cols = config.columns || 3

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{config.title}</h2>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, minmax(0, 1fr))` }}
      >
        {(config.cards || []).map((card, i) => {
          const content = (
            <>
              {card.icon && <span className="text-3xl mb-2 block" aria-hidden="true">{card.icon}</span>}
              {card.tag && (
                <span className="inline-block text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mb-2">
                  {card.tag}
                </span>
              )}
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
            </>
          )

          const cls = "bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"

          return card.link ? (
            <a key={i} href={card.link} className={cls} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            <div key={i} className={cls}>
              {content}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          div[style] { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) and (max-width: 768px) {
          div[style] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `}</style>
    </div>
  )
}
