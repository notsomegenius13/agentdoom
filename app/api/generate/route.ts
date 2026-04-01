import { NextRequest } from 'next/server'
import { runPipeline } from '@/lib/forge/pipeline'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const result = await runPipeline({
          prompt,
          fastMode: true, // skip Playwright in API context for speed
          retryOnFailure: true,
          onProgress: (event) => {
            const stageMap: Record<string, string> = {
              classify: 'classifying',
              generate: 'generating',
              assemble: 'assembling',
              validate: 'validating',
              deploy: 'deploying',
              done: 'done',
              error: 'error',
            }
            const data: Record<string, unknown> = {
              stage: stageMap[event.stage] || event.stage,
              line: event.message,
            }
            // Send preview HTML when assembly completes
            if (event.stage === 'assemble' && event.data?.html) {
              data.preview = event.data.html
            }
            send(data)
          },
        })

        // Send preview HTML
        send({ preview: result.html, line: 'Preview ready' })

        // Send validation summary
        if (result.validation.overallVerdict === 'fail') {
          send({
            stage: 'validating',
            line: `Warning: validation failed at ${result.validation.retryContext?.failedStage || 'unknown'} stage`,
            validationWarning: true,
          })
        }

        // Final result
        send({
          stage: 'done',
          url: result.url,
          timing: result.timing,
          validation: result.validation.overallVerdict,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Generation error:', err)
        send({ stage: 'error', line: `Error: ${message}` })
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
