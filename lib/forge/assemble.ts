/**
 * Forge: Assembly
 * Takes a ToolConfig and assembles it into deployable HTML
 */

import type { ToolConfig } from './generate'

export function assembleTool(config: ToolConfig): string {
  // TODO: Replace with actual primitive assembly
  // This will render configured primitives into a standalone React app
  // For now, generate a basic HTML representation

  const primitivesHtml = config.primitives
    .sort((a, b) => a.position - b.position)
    .map((p) => `<div class="primitive" data-type="${p.type}" data-id="${p.id}">
      <!-- ${p.type} primitive: ${JSON.stringify(p.props)} -->
      <div class="placeholder">[${p.type}]</div>
    </div>`)
    .join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${config.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${config.theme.fontFamily};
      background: ${config.theme.backgroundColor};
      max-width: ${config.layout.maxWidth};
      margin: 0 auto;
      padding: ${config.layout.padding};
    }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .description { color: #666; font-size: 14px; margin-bottom: 24px; }
    .primitive { margin-bottom: 16px; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #aaa; }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <h1>${config.title}</h1>
  <p class="description">${config.description}</p>
  ${primitivesHtml}
  <div class="footer">
    Built with <a href="https://agentdoom.ai">AgentDoom</a>
  </div>
</body>
</html>`
}
