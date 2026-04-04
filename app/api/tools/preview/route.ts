import { NextRequest, NextResponse } from 'next/server'
import { assembleTool } from '@/lib/forge/assemble'
import type { ToolConfig } from '@/lib/forge/generate'

/**
 * POST /api/tools/preview — Generate preview HTML from a ToolConfig
 * Used by the customization wizard for live preview updates.
 */
export async function POST(req: NextRequest) {
  try {
    const config = (await req.json()) as ToolConfig

    if (!config || !config.primitives || !config.theme) {
      return NextResponse.json(
        { error: 'Valid ToolConfig is required' },
        { status: 400 }
      )
    }

    const html = assembleTool(config)
    return NextResponse.json({ html })
  } catch (error) {
    console.error('[tools/preview] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
