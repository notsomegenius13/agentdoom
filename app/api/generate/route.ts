import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // SSE streaming response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Stage 1: Classification (Haiku)
        send({ stage: 'classifying', line: `Analyzing: "${prompt}"` })
        // TODO: Call Haiku for intent classification
        await new Promise(r => setTimeout(r, 500))
        send({ line: 'Intent classified: utility tool' })
        send({ line: 'Primitives selected: [form, calculator, display]' })

        // Stage 2: Generation (Sonnet)
        send({ stage: 'generating', line: 'Generating tool configuration...' })
        // TODO: Call Sonnet with primitive schemas + prompt
        await new Promise(r => setTimeout(r, 1500))
        send({ line: 'Configuration generated' })
        send({ line: 'Wiring components...' })

        // Stage 3: Assembly
        send({ stage: 'assembling', line: 'Assembling React components...' })
        // TODO: Assemble primitives from config
        await new Promise(r => setTimeout(r, 800))
        send({ line: 'Components assembled' })
        send({ line: 'Running validation pipeline...' })

        // Stage 4: Deploy
        send({ stage: 'deploying', line: 'Deploying to edge...' })
        // TODO: Deploy to Cloudflare Workers
        await new Promise(r => setTimeout(r, 600))

        // Return preview HTML (placeholder)
        send({
          preview: `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body{font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fafafa;}
h1{font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:16px;}
p{color:#666;font-size:14px;}
.card{background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-top:16px;}
input{width:100%;padding:12px;border:1px solid #e5e5e5;border-radius:8px;font-size:16px;box-sizing:border-box;margin-top:8px;}
button{width:100%;padding:12px;background:#7c3aed;color:white;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;margin-top:12px;}
</style></head>
<body>
<h1>Your Tool</h1>
<p>Generated from: "${prompt.replace(/"/g, '&quot;')}"</p>
<div class="card">
  <label>Input</label>
  <input type="text" placeholder="Enter value..." />
  <button onclick="alert('Tool action!')">Calculate</button>
</div>
<p style="margin-top:24px;text-align:center;font-size:12px;color:#aaa;">Built with AgentDoom</p>
</body>
</html>`,
          line: 'Tool deployed successfully!',
        })

        send({ stage: 'done', url: '#' })
      } catch (err) {
        send({ stage: 'error', line: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` })
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
