import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getToolBySlug } from '@/lib/feed'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const tool = await getToolBySlug(params.slug)

  if (!tool) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#fff',
            fontSize: 48,
            fontFamily: 'sans-serif',
          }}
        >
          Tool not found
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }

  const categoryColors: Record<string, string> = {
    money: '#10b981',
    productivity: '#3b82f6',
    social: '#ec4899',
    creator: '#f59e0b',
    business: '#8b5cf6',
    utility: '#6b7280',
  }

  const accentColor = categoryColors[tool.category] || '#7c3aed'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          fontFamily: 'sans-serif',
          padding: 60,
          position: 'relative',
        }}
      >
        {/* Accent gradient bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${accentColor}, #7c3aed)`,
          }}
        />

        {/* Category badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: `${accentColor}22`,
              color: accentColor,
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {tool.category}
          </div>
          {tool.isPaid && (
            <div
              style={{
                background: '#10b98122',
                color: '#10b981',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              ${(tool.priceCents / 100).toFixed(2)}
            </div>
          )}
        </div>

        {/* Title */}
        <div
          style={{
            color: '#ffffff',
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: '90%',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          {tool.title.length > 60
            ? tool.title.slice(0, 57) + '...'
            : tool.title}
        </div>

        {/* Description */}
        {tool.description && (
          <div
            style={{
              color: '#9ca3af',
              fontSize: 26,
              lineHeight: 1.4,
              maxWidth: '80%',
              marginBottom: 32,
              display: 'flex',
            }}
          >
            {tool.description.length > 120
              ? tool.description.slice(0, 117) + '...'
              : tool.description}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, display: 'flex' }} />

        {/* Bottom bar: stats + branding */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, color: '#6b7280', fontSize: 20 }}>
            <span>{tool.viewsCount.toLocaleString()} views</span>
            <span>{tool.usesCount.toLocaleString()} uses</span>
            <span>{tool.likesCount.toLocaleString()} likes</span>
          </div>

          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: '#7c3aed', fontSize: 28, fontWeight: 800 }}>
              Agent
            </div>
            <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 800 }}>
              Doom
            </div>
            <div style={{ color: '#6b7280', fontSize: 18, marginLeft: 8 }}>
              Tap to use — or make your own
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
