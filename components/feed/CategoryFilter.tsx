'use client'

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'money', label: 'Money' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'social', label: 'Social' },
  { key: 'creator', label: 'Creator' },
  { key: 'business', label: 'Business' },
  { key: 'utility', label: 'Utility' },
]

interface CategoryFilterProps {
  active: string
  onChange: (category: string) => void
}

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={`whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 text-xs font-medium transition-colors ${
            active === cat.key
              ? 'bg-doom-accent text-white'
              : 'bg-doom-gray text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
