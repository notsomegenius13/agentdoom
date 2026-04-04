/**
 * Forge: Assembly
 * Takes a ToolConfig and assembles it into deployable, interactive HTML
 * Each primitive type renders to standalone HTML/CSS/JS — no React dependency at runtime
 */

import type { ToolConfig, PrimitiveConfig } from './generate'
import { getRendererTypes } from './primitive-registry'

export function assembleTool(config: ToolConfig): string {
  const primitivesHtml = config.primitives
    .sort((a, b) => a.position - b.position)
    .map((p) => renderPrimitive(p))
    .join('\n')

  const layoutClass =
    config.layout.type === 'two-column' ? 'layout-two-col' :
    config.layout.type === 'full-width' ? 'layout-full-width' : 'layout-single'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(config.title)}</title>
  <meta name="description" content="${esc(config.description)}" />
  <meta property="og:title" content="${esc(config.title)}" />
  <meta property="og:description" content="${esc(config.description)}" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${esc(config.theme.fontFamily)};
      background: ${esc(config.theme.backgroundColor)};
      color: #1a1a1a;
      min-height: 100vh;
    }
    .app-container {
      max-width: ${esc(config.layout.maxWidth || '100%')};
      margin: 0 auto;
      padding: ${esc(config.layout.padding || '24px')};
    }
    .app-title { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    .app-desc { color: #666; font-size: 14px; margin-bottom: 24px; }
    .primitive-block { margin-bottom: 24px; }
    .layout-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 600px) { .layout-two-col { grid-template-columns: 1fr; } }

    /* Shared component styles */
    .card { background: #fff; border-radius: ${esc(config.theme.borderRadius)}; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px; }
    input[type="text"], input[type="number"], input[type="email"], textarea, select {
      width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 15px; font-family: inherit; margin-bottom: 12px; background: #fff;
    }
    input:focus, textarea:focus, select:focus { outline: none; border-color: ${esc(config.theme.primaryColor)}; box-shadow: 0 0 0 3px ${esc(config.theme.primaryColor)}22; }
    textarea { min-height: 80px; resize: vertical; }
    button, .btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 10px 20px; background: ${esc(config.theme.primaryColor)}; color: #fff;
      border: none; border-radius: 8px; font-size: 15px; font-weight: 600;
      cursor: pointer; font-family: inherit; width: 100%;
    }
    button:hover { opacity: 0.9; }
    .result-box { background: #f0fdf4; border: 2px solid ${esc(config.theme.primaryColor)}; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: center; }
    .result-label { font-size: 13px; color: #666; margin-bottom: 4px; }
    .result-value { font-size: 28px; font-weight: 700; color: ${esc(config.theme.primaryColor)}; }

    /* Checklist */
    .checklist-cat { margin-bottom: 16px; }
    .checklist-cat h3 { font-size: 15px; font-weight: 600; margin-bottom: 8px; color: #374151; }
    .checklist-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
    .checklist-item input[type="checkbox"] { width: 18px; height: 18px; accent-color: ${esc(config.theme.primaryColor)}; margin: 0; }
    .checklist-item label { margin: 0; font-size: 14px; cursor: pointer; }
    .checklist-item.checked label { text-decoration: line-through; color: #9ca3af; }
    .progress-bar { background: #e5e7eb; border-radius: 999px; height: 8px; overflow: hidden; margin-bottom: 16px; }
    .progress-fill { height: 100%; background: ${esc(config.theme.primaryColor)}; border-radius: 999px; transition: width 0.3s; }

    /* Table */
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    tr:hover td { background: #f9fafb; }
    .search-input { margin-bottom: 12px; }

    /* Card grid */
    .card-grid { display: grid; gap: 16px; }
    .card-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
    .card-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 600px) { .card-grid.cols-2, .card-grid.cols-3 { grid-template-columns: 1fr; } }
    .grid-card { background: #fff; border-radius: ${esc(config.theme.borderRadius)}; padding: 16px; border: 1px solid #e5e7eb; }
    .grid-card .icon { font-size: 28px; margin-bottom: 8px; }
    .grid-card h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .grid-card p { font-size: 13px; color: #6b7280; }
    .grid-card .tag { display: inline-block; font-size: 11px; background: ${esc(config.theme.primaryColor)}15; color: ${esc(config.theme.primaryColor)}; padding: 2px 8px; border-radius: 999px; margin-top: 8px; }

    /* List */
    .list-items { list-style: none; }
    .list-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .list-item:last-child { border: none; }
    .remove-btn { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 18px; width: auto; padding: 4px 8px; }
    .add-row { display: flex; gap: 8px; margin-top: 12px; }
    .add-row input { flex: 1; margin: 0; }
    .add-row button { width: auto; }

    /* Timer */
    .timer-display { font-size: 48px; font-weight: 700; text-align: center; font-variant-numeric: tabular-nums; margin: 24px 0; color: ${esc(config.theme.primaryColor)}; }
    .timer-presets { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .timer-presets button { flex: 1; min-width: 80px; background: #f3f4f6; color: #374151; font-weight: 500; }
    .timer-presets button.active { background: ${esc(config.theme.primaryColor)}; color: #fff; }
    .timer-controls { display: flex; gap: 8px; }
    .timer-controls button { flex: 1; }

    /* Quiz */
    .quiz-question { margin-bottom: 20px; }
    .quiz-question h3 { font-size: 16px; margin-bottom: 12px; }
    .quiz-option { display: block; padding: 10px 14px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; font-size: 14px; transition: all 0.15s; }
    .quiz-option:hover { border-color: ${esc(config.theme.primaryColor)}; }
    .quiz-option.selected { border-color: ${esc(config.theme.primaryColor)}; background: ${esc(config.theme.primaryColor)}10; }
    .quiz-option.correct { border-color: #10b981; background: #ecfdf5; }
    .quiz-option.wrong { border-color: #ef4444; background: #fef2f2; }
    .quiz-score { text-align: center; font-size: 20px; font-weight: 700; margin-top: 20px; }

    /* Generator */
    .gen-output { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; min-height: 60px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
    .copy-btn { margin-top: 8px; background: #374151; font-size: 13px; }

    /* Template */
    .template-output { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }

    /* Chart */
    .chart-container { position: relative; }
    .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 200px; padding-top: 20px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar { border-radius: 4px 4px 0 0; width: 100%; min-width: 20px; transition: height 0.5s; }
    .bar-label { font-size: 11px; color: #6b7280; text-align: center; word-break: break-word; }
    .bar-value { font-size: 12px; font-weight: 600; }

    /* Tracker */
    .tracker-grid { display: flex; flex-direction: column; gap: 8px; }
    .tracker-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px; }
    .tracker-item .name { font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .tracker-item .streak { font-size: 13px; color: ${esc(config.theme.primaryColor)}; font-weight: 600; }
    .tracker-btn { background: ${esc(config.theme.primaryColor)}; color: #fff; border: none; width: 32px; height: 32px; border-radius: 999px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
    .tracker-btn.done { background: #10b981; }

    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #aaa; }
    .footer a { color: ${esc(config.theme.primaryColor)}; text-decoration: none; }

    /* Full-width layout */
    .layout-full-width { width: 100%; }

    /* Split calculator */
    .tip-presets { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .tip-presets button { flex: 1; min-width: 60px; background: #f3f4f6; color: #374151; font-weight: 500; }
    .tip-presets button.active { background: ${esc(config.theme.primaryColor)}; color: #fff; }
    .split-results { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
    .split-result-box { background: #f9fafb; border-radius: 8px; padding: 12px; text-align: center; }
    .split-result-box .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .split-result-box .value { font-size: 22px; font-weight: 700; color: ${esc(config.theme.primaryColor)}; }

    /* Converter */
    .converter-cats { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .converter-cats button { flex: 1; min-width: 80px; background: #f3f4f6; color: #374151; font-weight: 500; font-size: 13px; }
    .converter-cats button.active { background: ${esc(config.theme.primaryColor)}; color: #fff; }
    .converter-row { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
    .converter-row select { width: auto; flex: 1; margin: 0; }
    .converter-row input { flex: 1; margin: 0; }
    .swap-btn { background: #f3f4f6; color: #374151; width: 40px; padding: 8px; flex-shrink: 0; }

    /* Poll */
    .poll-option { display: flex; align-items: center; padding: 10px 14px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden; }
    .poll-option:hover { border-color: ${esc(config.theme.primaryColor)}; }
    .poll-option.voted { border-color: ${esc(config.theme.primaryColor)}; }
    .poll-bar { position: absolute; left: 0; top: 0; bottom: 0; background: ${esc(config.theme.primaryColor)}12; transition: width 0.4s; border-radius: 6px; }
    .poll-label { position: relative; z-index: 1; flex: 1; font-size: 14px; font-weight: 500; }
    .poll-pct { position: relative; z-index: 1; font-size: 14px; font-weight: 600; color: ${esc(config.theme.primaryColor)}; }

    /* Pricing table */
    .pricing-toggle { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px; font-size: 14px; }
    .pricing-toggle .toggle { width: 48px; height: 26px; border-radius: 13px; background: #d1d5db; cursor: pointer; position: relative; transition: background 0.2s; }
    .pricing-toggle .toggle.active { background: ${esc(config.theme.primaryColor)}; }
    .pricing-toggle .toggle::after { content: ''; position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #fff; top: 2px; left: 2px; transition: transform 0.2s; }
    .pricing-toggle .toggle.active::after { transform: translateX(22px); }
    .pricing-tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    @media (max-width: 600px) { .pricing-tiers { grid-template-columns: 1fr; } }
    .pricing-tier { background: #fff; border: 2px solid #e5e7eb; border-radius: ${esc(config.theme.borderRadius)}; padding: 24px; display: flex; flex-direction: column; }
    .pricing-tier.highlighted { border-color: ${esc(config.theme.primaryColor)}; box-shadow: 0 4px 12px ${esc(config.theme.primaryColor)}22; }
    .pricing-tier .tier-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .pricing-tier .tier-price { font-size: 36px; font-weight: 800; color: ${esc(config.theme.primaryColor)}; margin: 8px 0; }
    .pricing-tier .tier-price span { font-size: 14px; font-weight: 400; color: #6b7280; }
    .pricing-tier .tier-desc { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
    .pricing-tier .features { list-style: none; margin-bottom: 20px; flex: 1; }
    .pricing-tier .features li { font-size: 13px; padding: 4px 0; display: flex; align-items: center; gap: 8px; }
    .pricing-tier .features li::before { content: '✓'; color: ${esc(config.theme.primaryColor)}; font-weight: 700; }

    /* Kanban board */
    .kanban { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; min-height: 300px; }
    .kanban-col { min-width: 220px; flex: 1; background: #f1f5f9; border-radius: 8px; padding: 12px; }
    .kanban-col-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid transparent; }
    .kanban-col-header h3 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .kanban-col-header .count { font-size: 11px; background: #e2e8f0; border-radius: 999px; padding: 1px 8px; color: #64748b; }
    .kanban-card { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); cursor: grab; border-left: 3px solid transparent; }
    .kanban-card:active { cursor: grabbing; }
    .kanban-card h4 { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .kanban-card p { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
    .kanban-card .tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .kanban-card .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; }
    .kanban-card .priority { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .kanban-card .priority.high { background: #fef2f2; color: #dc2626; }
    .kanban-card .priority.medium { background: #fffbeb; color: #d97706; }
    .kanban-card .priority.low { background: #f0fdf4; color: #16a34a; }

    /* Stats dashboard */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
    @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
    .stat-card { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .stat-card .stat-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .stat-card .stat-value { font-size: 24px; font-weight: 700; }
    .stat-card .stat-change { font-size: 12px; margin-top: 4px; font-weight: 500; }
    .stat-card .stat-change.positive { color: #16a34a; }
    .stat-card .stat-change.negative { color: #dc2626; }
    .line-chart-container { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .line-chart-container h3 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }

    /* Wizard form */
    .wizard-steps { display: flex; gap: 4px; margin-bottom: 24px; }
    .wizard-step { flex: 1; height: 4px; border-radius: 2px; background: #e5e7eb; transition: background 0.3s; }
    .wizard-step.active { background: ${esc(config.theme.primaryColor)}; }
    .wizard-step.completed { background: ${esc(config.theme.primaryColor)}; opacity: 0.6; }
    .wizard-step-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    .wizard-nav { display: flex; gap: 8px; margin-top: 16px; }
    .wizard-nav button { flex: 1; }
    .wizard-nav .btn-back { background: #6b7280; }

    /* Realtime collab */
    .collab-editor { position: relative; min-height: 200px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 14px; line-height: 1.6; white-space: pre-wrap; outline: none; background: #fff; }
    .collab-editor:focus { border-color: ${esc(config.theme.primaryColor)}; box-shadow: 0 0 0 3px ${esc(config.theme.primaryColor)}22; }
    .collab-presence { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .collab-avatar { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; color: #fff; animation: collab-pulse 2s infinite; }
    .collab-avatar .dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; opacity: 0.8; }
    @keyframes collab-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.85; } }
    .collab-cursor { position: absolute; width: 2px; height: 18px; animation: collab-blink 1s step-end infinite; }
    .collab-cursor-label { position: absolute; top: -18px; left: 0; font-size: 10px; font-weight: 600; color: #fff; padding: 1px 6px; border-radius: 3px; white-space: nowrap; pointer-events: none; }
    @keyframes collab-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
    .collab-toolbar { display: flex; gap: 6px; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 8px; flex-wrap: wrap; }
    .collab-toolbar button { background: #fff; border: 1px solid #e5e7eb; color: #374151; padding: 6px 12px; font-size: 13px; width: auto; border-radius: 6px; }
    .collab-toolbar button:hover { background: #f3f4f6; }
    .collab-status { font-size: 11px; color: #16a34a; display: flex; align-items: center; gap: 4px; margin-left: auto; }
    .collab-status .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; }

    /* AI chat widget */
    .chat-container { display: flex; flex-direction: column; height: 420px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; }
    .chat-header { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 10px; background: ${esc(config.theme.primaryColor)}; color: #fff; }
    .chat-header .avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .chat-header .info h3 { font-size: 14px; font-weight: 600; margin: 0; }
    .chat-header .info p { font-size: 11px; opacity: 0.85; margin: 0; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .chat-msg { max-width: 80%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
    .chat-msg.bot { background: #f3f4f6; color: #1a1a1a; align-self: flex-start; border-bottom-left-radius: 4px; }
    .chat-msg.user { background: ${esc(config.theme.primaryColor)}; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
    .chat-msg .typing { display: inline-flex; gap: 4px; padding: 4px 0; }
    .chat-msg .typing span { width: 6px; height: 6px; border-radius: 50%; background: #9ca3af; animation: chat-bounce 1.4s infinite; }
    .chat-msg .typing span:nth-child(2) { animation-delay: 0.2s; }
    .chat-msg .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes chat-bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
    .chat-input-row { padding: 12px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; background: #fff; }
    .chat-input-row input { flex: 1; margin: 0; border-radius: 999px; padding: 10px 16px; }
    .chat-input-row button { width: 42px; height: 42px; border-radius: 50%; padding: 0; flex-shrink: 0; font-size: 18px; }

    /* Payment form */
    .payment-form { max-width: 440px; }
    .payment-card-frame { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; background: #fff; display: flex; align-items: center; gap: 10px; }
    .payment-card-frame:focus-within { border-color: ${esc(config.theme.primaryColor)}; box-shadow: 0 0 0 3px ${esc(config.theme.primaryColor)}22; }
    .payment-card-frame input { border: none; outline: none; padding: 0; margin: 0; font-size: 15px; flex: 1; background: transparent; }
    .payment-card-frame .card-icon { font-size: 20px; flex-shrink: 0; }
    .payment-row { display: flex; gap: 12px; }
    .payment-row > div { flex: 1; }
    .payment-secure { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280; margin-top: 12px; justify-content: center; }
    .payment-secure .lock { font-size: 14px; }
    .payment-summary { background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .payment-summary .line { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
    .payment-summary .line.total { font-weight: 700; font-size: 16px; border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 8px; }

    /* Analytics dashboard */
    .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    @media (max-width: 600px) { .analytics-grid { grid-template-columns: 1fr 1fr; } }
    .analytics-kpi { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .analytics-kpi .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .analytics-kpi .kpi-icon { font-size: 20px; }
    .analytics-kpi .kpi-label { font-size: 12px; color: #6b7280; }
    .analytics-kpi .kpi-value { font-size: 26px; font-weight: 700; }
    .analytics-kpi .kpi-trend { font-size: 12px; font-weight: 600; margin-top: 4px; }
    .analytics-kpi .kpi-trend.up { color: #16a34a; }
    .analytics-kpi .kpi-trend.down { color: #dc2626; }
    .analytics-chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    @media (max-width: 600px) { .analytics-chart-grid { grid-template-columns: 1fr; } }
    .analytics-chart-card { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .analytics-chart-card h3 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
    .analytics-tabs { display: flex; gap: 4px; margin-bottom: 16px; padding: 4px; background: #f3f4f6; border-radius: 8px; }
    .analytics-tabs button { flex: 1; background: transparent; color: #6b7280; font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 6px; border: none; }
    .analytics-tabs button.active { background: #fff; color: #1a1a1a; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }

    /* Notification center */
    .notif-bell { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #f3f4f6; cursor: pointer; border: none; padding: 0; font-size: 20px; color: #374151; }
    .notif-bell:hover { background: #e5e7eb; }
    .notif-badge { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .notif-panel { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; overflow: hidden; margin-top: 12px; max-height: 400px; overflow-y: auto; }
    .notif-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
    .notif-panel-header h3 { font-size: 15px; font-weight: 600; margin: 0; }
    .notif-panel-header button { background: none; border: none; color: ${esc(config.theme.primaryColor)}; font-size: 12px; font-weight: 600; cursor: pointer; width: auto; padding: 4px 8px; }
    .notif-item { display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; cursor: pointer; }
    .notif-item:hover { background: #f9fafb; }
    .notif-item.unread { background: ${esc(config.theme.primaryColor)}05; }
    .notif-item.unread::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: ${esc(config.theme.primaryColor)}; flex-shrink: 0; margin-top: 6px; }
    .notif-item .notif-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .notif-item .notif-content { flex: 1; min-width: 0; }
    .notif-item .notif-title { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
    .notif-item .notif-desc { font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-item .notif-time { font-size: 11px; color: #9ca3af; flex-shrink: 0; }
    .notif-empty { text-align: center; padding: 32px 16px; color: #9ca3af; font-size: 14px; }
    .notif-toast { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 10px; background: #1a1a1a; color: #fff; font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 10px; z-index: 9999; animation: notif-slide-in 0.3s ease-out; max-width: 360px; }
    .notif-toast .toast-close { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; width: auto; padding: 0; font-size: 16px; }
    @keyframes notif-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  </style>
</head>
<body>
  <div class="app-container">
    <h1 class="app-title">${esc(config.title)}</h1>
    <p class="app-desc">${esc(config.description)}</p>
    <div class="${layoutClass}">
      ${primitivesHtml}
    </div>
    <div class="footer">
      Built with <a href="https://agentdoom.ai">AgentDoom</a> · <a href="https://agentdoom.ai">Make your own</a>
    </div>
  </div>
</body>
</html>`
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderPrimitive(p: PrimitiveConfig): string {
  const renderer = RENDERERS[p.type]
  if (!renderer) {
    return `<div class="primitive-block card"><p>Unknown primitive: ${esc(p.type)}</p></div>`
  }
  return `<div class="primitive-block" id="${esc(p.id)}">${renderer(p)}</div>`
}

const RENDERERS: Record<string, (p: PrimitiveConfig) => string> = {
  calculator: renderCalculator,
  form: renderForm,
  checklist: renderChecklist,
  table: renderTable,
  'card-grid': renderCardGrid,
  list: renderList,
  timer: renderTimer,
  quiz: renderQuiz,
  generator: renderGenerator,
  template: renderTemplate,
  chart: renderChart,
  tracker: renderTracker,
  'split-calculator': renderSplitCalculator,
  converter: renderConverter,
  poll: renderPoll,
  'pricing-table': renderPricingTable,
  'kanban-board': renderKanbanBoard,
  'stats-dashboard': renderStatsDashboard,
  'wizard-form': renderWizardForm,
  'realtime-collab': renderRealtimeCollab,
  'ai-chat': renderAiChat,
  'payment-form': renderPaymentForm,
  'analytics-dashboard': renderAnalyticsDashboard,
  'notification-center': renderNotificationCenter,
  // Previously generator-only (schemas existed, renderers were missing)
  calendar: renderCalendar,
  'progress-bar': renderProgressBar,
  search: renderSearch,
  accordion: renderAccordion,
}

// Sanity-check: warn at startup if the registry lists hasRenderer=true for a
// type that doesn't have an entry in RENDERERS.
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const missing = [...getRendererTypes()].filter((t) => !RENDERERS[t])
  if (missing.length > 0) {
    console.warn('[Forge] Registry/assembler mismatch — missing renderers:', missing)
  }
}

function renderCalculator(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    inputs: Array<{
      name: string; label: string; type: string
      defaultValue?: number; min?: number; max?: number; step?: number
      options?: Array<{ label: string; value: number }>
    }>
    formula: string
    resultLabel: string
    resultPrefix?: string
    resultSuffix?: string
  }

  const inputsHtml = (props.inputs || []).map((input) => {
    if (input.type === 'select' && input.options) {
      const opts = input.options
        .map((o) => `<option value="${o.value}">${esc(o.label)}</option>`)
        .join('')
      return `<label>${esc(input.label)}</label><select id="calc-${esc(input.name)}" onchange="calc_${esc(p.id)}()">${opts}</select>`
    }
    return `<label>${esc(input.label)}</label><input type="number" id="calc-${esc(input.name)}" value="${input.defaultValue ?? 0}" min="${input.min ?? ''}" max="${input.max ?? ''}" step="${input.step ?? 'any'}" oninput="calc_${esc(p.id)}()" />`
  }).join('\n')

  const getVars = (props.inputs || [])
    .map((i) => `var ${i.name} = parseFloat(document.getElementById('calc-${i.name}').value) || 0;`)
    .join('\n')

  return `<div class="card">
  <h2>${esc(props.title || 'Calculator')}</h2>
  ${inputsHtml}
  <div class="result-box">
    <div class="result-label">${esc(props.resultLabel || 'Result')}</div>
    <div class="result-value" id="result-${esc(p.id)}">${esc(props.resultPrefix || '')}0${esc(props.resultSuffix || '')}</div>
  </div>
</div>
<script>
function calc_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}() {
  try {
    ${getVars}
    var result = ${props.formula || '0'};
    var formatted = (typeof result === 'number' && !isNaN(result)) ? result.toFixed(2) : '0';
    document.getElementById('result-${p.id}').textContent = '${props.resultPrefix || ''}' + formatted + '${props.resultSuffix || ''}';
  } catch(e) { console.error(e); }
}
calc_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}();
</script>`
}

function renderForm(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    fields: Array<{ name: string; label: string; type: string; placeholder?: string; options?: string[]; required?: boolean }>
    submitLabel: string
    successMessage: string
  }

  const fieldsHtml = (props.fields || []).map((f) => {
    if (f.type === 'textarea') {
      return `<label>${esc(f.label)}${f.required ? ' *' : ''}</label><textarea name="${esc(f.name)}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'required' : ''}></textarea>`
    }
    if (f.type === 'select' && f.options) {
      const opts = f.options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')
      return `<label>${esc(f.label)}${f.required ? ' *' : ''}</label><select name="${esc(f.name)}" ${f.required ? 'required' : ''}><option value="">Select...</option>${opts}</select>`
    }
    if (f.type === 'checkbox') {
      return `<div class="checklist-item"><input type="checkbox" name="${esc(f.name)}" id="f-${esc(f.name)}" /><label for="f-${esc(f.name)}">${esc(f.label)}</label></div>`
    }
    return `<label>${esc(f.label)}${f.required ? ' *' : ''}</label><input type="${f.type || 'text'}" name="${esc(f.name)}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'required' : ''} />`
  }).join('\n')

  return `<div class="card">
  <h2>${esc(props.title || 'Form')}</h2>
  <form id="form-${esc(p.id)}" onsubmit="event.preventDefault(); document.getElementById('form-success-${p.id}').style.display='block'; this.reset();">
    ${fieldsHtml}
    <button type="submit">${esc(props.submitLabel || 'Submit')}</button>
  </form>
  <div id="form-success-${esc(p.id)}" style="display:none; margin-top:12px; padding:12px; background:#ecfdf5; border-radius:8px; color:#059669; text-align:center; font-weight:500;">
    ${esc(props.successMessage || 'Submitted successfully!')}
  </div>
</div>`
}

function renderChecklist(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    categories: Array<{ name: string; items: string[] }>
    showProgress: boolean
  }

  let itemIndex = 0
  const catsHtml = (props.categories || []).map((cat) => {
    const items = cat.items.map((item) => {
      const idx = itemIndex++
      return `<div class="checklist-item" id="cli-${p.id}-${idx}">
        <input type="checkbox" id="chk-${p.id}-${idx}" onchange="updateProgress_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}(this)" />
        <label for="chk-${p.id}-${idx}">${esc(item)}</label>
      </div>`
    }).join('\n')
    return `<div class="checklist-cat"><h3>${esc(cat.name)}</h3>${items}</div>`
  }).join('\n')

  const totalItems = itemIndex

  const progressHtml = props.showProgress
    ? `<div class="progress-bar"><div class="progress-fill" id="prog-${esc(p.id)}" style="width:0%"></div></div>
       <div style="text-align:right;font-size:12px;color:#6b7280;margin-bottom:12px;" id="prog-text-${esc(p.id)}">0 / ${totalItems}</div>`
    : ''

  return `<div class="card">
  <h2>${esc(props.title || 'Checklist')}</h2>
  ${progressHtml}
  ${catsHtml}
</div>
<script>
function updateProgress_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}(el) {
  var item = el.closest('.checklist-item');
  if (el.checked) item.classList.add('checked'); else item.classList.remove('checked');
  var total = ${totalItems};
  var checked = document.querySelectorAll('#${p.id} input[type=checkbox]:checked').length;
  var pct = Math.round((checked/total)*100);
  var bar = document.getElementById('prog-${p.id}');
  if(bar) bar.style.width = pct + '%';
  var txt = document.getElementById('prog-text-${p.id}');
  if(txt) txt.textContent = checked + ' / ' + total;
}
</script>`
}

function renderTable(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    columns: Array<{ key: string; label: string; type?: string }>
    rows: Array<Record<string, unknown>>
    searchable?: boolean
  }

  const thHtml = (props.columns || []).map((c) => `<th>${esc(c.label)}</th>`).join('')
  const rowsHtml = (props.rows || []).map((row, ri) => {
    const cells = (props.columns || []).map((c) => {
      let val = String(row[c.key] ?? '')
      if (c.type === 'currency') val = '$' + parseFloat(val || '0').toFixed(2)
      return `<td>${esc(val)}</td>`
    }).join('')
    return `<tr class="table-row" data-row="${ri}">${cells}</tr>`
  }).join('\n')

  const searchHtml = props.searchable
    ? `<input type="text" class="search-input" placeholder="Search..." oninput="filterTable_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}(this.value)" />`
    : ''

  const searchScript = props.searchable
    ? `<script>
function filterTable_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}(q) {
  var rows = document.querySelectorAll('#${p.id} .table-row');
  q = q.toLowerCase();
  rows.forEach(function(r) { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
}
</script>`
    : ''

  return `<div class="card">
  <h2>${esc(props.title || 'Table')}</h2>
  ${searchHtml}
  <div style="overflow-x:auto;">
    <table><thead><tr>${thHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>
  </div>
</div>
${searchScript}`
}

function renderCardGrid(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    cards: Array<{ title: string; description: string; icon?: string; tag?: string; link?: string }>
    columns: number
  }

  const cols = props.columns || 2
  const cardsHtml = (props.cards || []).map((c) => {
    const iconHtml = c.icon ? `<div class="icon">${c.icon}</div>` : ''
    const tagHtml = c.tag ? `<div class="tag">${esc(c.tag)}</div>` : ''
    return `<div class="grid-card">${iconHtml}<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p>${tagHtml}</div>`
  }).join('\n')

  return `<div class="card">
  <h2>${esc(props.title || 'Cards')}</h2>
  <div class="card-grid cols-${cols}">${cardsHtml}</div>
</div>`
}

function renderList(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    items: string[]
    addable?: boolean
    removable?: boolean
    placeholder?: string
  }

  const itemsJson = JSON.stringify(props.items || [])
  const fnName = 'list_' + p.id.replace(/[^a-zA-Z0-9]/g, '_')
  const canRemove = props.removable !== false
  const canAdd = props.addable !== false

  const addHtml = canAdd
    ? '<div class="add-row">' +
      '<input type="text" id="add-input-' + esc(p.id) + '" placeholder="' + esc(props.placeholder || 'Add item...') + '" onkeydown="if(event.key===\'Enter\'){' + fnName + '_add()}" />' +
      '<button onclick="' + fnName + '_add()">+</button>' +
      '</div>'
    : ''

  const removeBtn = canRemove
    ? "' + '<button class=\"remove-btn\" onclick=\"" + fnName + "_remove(' + i + ')\">\\u00d7</button>'"
    : "''"

  return '<div class="card">' +
    '<h2>' + esc(props.title || 'List') + '</h2>' +
    '<ul class="list-items" id="list-' + esc(p.id) + '"></ul>' +
    addHtml +
    '</div>' +
    '<script>' +
    '(function(){' +
    'var items = ' + itemsJson + ';' +
    'function render() {' +
    'var ul = document.getElementById("list-' + p.id + '");' +
    'ul.innerHTML = items.map(function(it, i) {' +
    "return '<li class=\"list-item\"><span>' + it + '</span>" + (canRemove ? "<button class=\"remove-btn\" onclick=\"" + fnName + "_remove(' + i + ')\">\\u00d7</button>" : "") + "</li>';" +
    '}).join("");' +
    '}' +
    'window.' + fnName + '_add = function() {' +
    'var inp = document.getElementById("add-input-' + p.id + '");' +
    'if(inp.value.trim()) { items.push(inp.value.trim()); inp.value=""; render(); }' +
    '};' +
    'window.' + fnName + '_remove = function(i) { items.splice(i,1); render(); };' +
    'render();' +
    '})();' +
    '</script>'
}

function renderTimer(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    mode: string
    durations: Array<{ label: string; seconds: number }>
    alertSound?: boolean
  }

  const durations = props.durations || [{ label: '5 min', seconds: 300 }]
  const fnName = `timer_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`

  const presetBtns = durations
    .map((d, i) => `<button onclick="${fnName}_preset(${d.seconds}, ${i})" ${i === 0 ? 'class="active"' : ''}>${esc(d.label)}</button>`)
    .join('')

  return `<div class="card">
  <h2>${esc(props.title || 'Timer')}</h2>
  <div class="timer-presets" id="presets-${esc(p.id)}">${presetBtns}</div>
  <div class="timer-display" id="display-${esc(p.id)}">${formatTime(durations[0]?.seconds || 300)}</div>
  <div class="timer-controls">
    <button onclick="${fnName}_toggle()" id="toggle-${esc(p.id)}">Start</button>
    <button onclick="${fnName}_reset()" style="background:#6b7280">Reset</button>
  </div>
</div>
<script>
(function(){
  var seconds = ${durations[0]?.seconds || 300}, remaining = seconds, interval = null, running = false;
  function fmt(s) { var m=Math.floor(s/60), sec=s%60; return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'); }
  function update() { document.getElementById('display-${p.id}').textContent = fmt(remaining); }
  window.${fnName}_preset = function(s, idx) {
    seconds=s; remaining=s; running=false; clearInterval(interval); interval=null;
    document.getElementById('toggle-${p.id}').textContent='Start';
    document.querySelectorAll('#presets-${p.id} button').forEach(function(b,i){b.className=i===idx?'active':'';});
    update();
  };
  window.${fnName}_toggle = function() {
    if(running) { running=false; clearInterval(interval); interval=null; document.getElementById('toggle-${p.id}').textContent='Resume'; }
    else { running=true; document.getElementById('toggle-${p.id}').textContent='Pause';
      interval=setInterval(function(){ if(remaining>0){remaining--;update();}else{clearInterval(interval);running=false;document.getElementById('toggle-${p.id}').textContent='Done!';}},1000);
    }
  };
  window.${fnName}_reset = function() { remaining=seconds; running=false; clearInterval(interval); interval=null; document.getElementById('toggle-${p.id}').textContent='Start'; update(); };
  update();
})();
</script>`
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function renderQuiz(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    questions: Array<{ question: string; options: string[]; correct: number; explanation?: string }>
    showScore: boolean
  }

  const fnName = `quiz_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const qData = JSON.stringify(props.questions || [])

  return `<div class="card">
  <h2>${esc(props.title || 'Quiz')}</h2>
  <div id="quiz-${esc(p.id)}"></div>
  ${props.showScore ? `<div class="quiz-score" id="score-${esc(p.id)}" style="display:none"></div>` : ''}
</div>
<script>
(function(){
  var qs = ${qData};
  var answers = new Array(qs.length).fill(-1);
  var revealed = new Array(qs.length).fill(false);
  function render() {
    var html = qs.map(function(q, qi) {
      var optsHtml = q.options.map(function(o, oi) {
        var cls = 'quiz-option';
        if(revealed[qi]) {
          if(oi === q.correct) cls += ' correct';
          else if(oi === answers[qi]) cls += ' wrong';
        } else if(answers[qi] === oi) cls += ' selected';
        return '<div class="'+cls+'" onclick="${fnName}_pick('+qi+','+oi+')">' + o + '</div>';
      }).join('');
      return '<div class="quiz-question"><h3>Q'+(qi+1)+'. '+q.question+'</h3>'+optsHtml+'</div>';
    }).join('');
    document.getElementById('quiz-${p.id}').innerHTML = html;
    if(revealed.every(Boolean)) {
      var score = answers.reduce(function(s,a,i){return s+(a===qs[i].correct?1:0);},0);
      var el = document.getElementById('score-${p.id}');
      if(el){el.style.display='block'; el.textContent='Score: '+score+' / '+qs.length;}
    }
  }
  window.${fnName}_pick = function(qi, oi) {
    if(revealed[qi]) return;
    answers[qi] = oi; revealed[qi] = true; render();
  };
  render();
})();
</script>`
}

function renderGenerator(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    inputLabel: string
    inputPlaceholder: string
    buttonLabel: string
    templates: string[]
    outputLabel: string
  }

  const fnName = `gen_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const templates = JSON.stringify(props.templates || ['{{input}}'])

  return `<div class="card">
  <h2>${esc(props.title || 'Generator')}</h2>
  <label>${esc(props.inputLabel || 'Input')}</label>
  <input type="text" id="gen-input-${esc(p.id)}" placeholder="${esc(props.inputPlaceholder || 'Enter something...')}" />
  <button onclick="${fnName}()">${esc(props.buttonLabel || 'Generate')}</button>
  <div id="gen-output-${esc(p.id)}" style="display:none">
    <label style="margin-top:12px">${esc(props.outputLabel || 'Result')}</label>
    <div class="gen-output" id="gen-text-${esc(p.id)}"></div>
    <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('gen-text-${p.id}').textContent)">Copy</button>
  </div>
</div>
<script>
(function(){
  var templates = ${templates};
  window.${fnName} = function() {
    var input = document.getElementById('gen-input-${p.id}').value.trim();
    if(!input) return;
    var tmpl = templates[Math.floor(Math.random()*templates.length)];
    var result = tmpl.replace(/\\{\\{input\\}\\}/g, input);
    document.getElementById('gen-text-${p.id}').textContent = result;
    document.getElementById('gen-output-${p.id}').style.display = 'block';
  };
})();
</script>`
}

function renderTemplate(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    fields: Array<{ name: string; label: string; placeholder: string; type?: string; options?: string[] }>
    template: string
    copyButton: boolean
  }

  const fnName = `tmpl_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`

  const fieldsHtml = (props.fields || []).map((f) => {
    if (f.type === 'textarea') {
      return `<label>${esc(f.label)}</label><textarea id="tmpl-${esc(p.id)}-${esc(f.name)}" placeholder="${esc(f.placeholder || '')}" oninput="${fnName}()"></textarea>`
    }
    if (f.type === 'select' && f.options) {
      const opts = f.options.map((o) => `<option>${esc(o)}</option>`).join('')
      return `<label>${esc(f.label)}</label><select id="tmpl-${esc(p.id)}-${esc(f.name)}" onchange="${fnName}()"><option value="">Select...</option>${opts}</select>`
    }
    return `<label>${esc(f.label)}</label><input type="text" id="tmpl-${esc(p.id)}-${esc(f.name)}" placeholder="${esc(f.placeholder || '')}" oninput="${fnName}()" />`
  }).join('\n')

  const getVals = (props.fields || [])
    .map((f) => `var ${f.name} = document.getElementById('tmpl-${p.id}-${f.name}').value || '[${f.label}]';`)
    .join('\n')

  // Build replacement chain
  const replacements = (props.fields || [])
    .map((f) => `.replace(/\\{\\{${f.name}\\}\\}/g, ${f.name})`)
    .join('')

  return `<div class="card">
  <h2>${esc(props.title || 'Template')}</h2>
  ${fieldsHtml}
  <div class="template-output" id="tmpl-out-${esc(p.id)}">${esc(props.template || '')}</div>
  ${props.copyButton !== false ? `<button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('tmpl-out-${p.id}').textContent)" style="margin-top:8px">Copy to Clipboard</button>` : ''}
</div>
<script>
function ${fnName}() {
  ${getVals}
  var tmpl = ${JSON.stringify(props.template || '')}${replacements};
  document.getElementById('tmpl-out-${p.id}').textContent = tmpl;
}
${fnName}();
</script>`
}

function renderChart(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    chartType: string
    data: Array<{ label: string; value: number; color?: string }>
    xLabel?: string
    yLabel?: string
  }

  const data = props.data || []
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const defaultColors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  if (props.chartType === 'pie') {
    // Simple CSS pie chart
    let cumulativePct = 0
    const total = data.reduce((s, d) => s + d.value, 0) || 1
    const segments = data.map((d, i) => {
      const pct = (d.value / total) * 100
      const start = cumulativePct
      cumulativePct += pct
      const color = d.color || defaultColors[i % defaultColors.length]
      return `${color} ${start}% ${cumulativePct}%`
    })

    const legendHtml = data.map((d, i) => {
      const color = d.color || defaultColors[i % defaultColors.length]
      const pct = ((d.value / total) * 100).toFixed(1)
      return `<div style="display:flex;align-items:center;gap:8px;font-size:13px;"><div style="width:12px;height:12px;border-radius:3px;background:${color};flex-shrink:0;"></div>${esc(d.label)}: ${d.value} (${pct}%)</div>`
    }).join('\n')

    return `<div class="card">
  <h2>${esc(props.title || 'Chart')}</h2>
  <div style="width:180px;height:180px;border-radius:50%;margin:20px auto;background:conic-gradient(${segments.join(', ')});"></div>
  <div style="display:flex;flex-direction:column;gap:6px;margin-top:16px;">${legendHtml}</div>
</div>`
  }

  // Default: bar chart
  const barsHtml = data.map((d, i) => {
    const color = d.color || defaultColors[i % defaultColors.length]
    const height = Math.round((d.value / maxVal) * 160)
    return `<div class="bar-col">
      <div class="bar-value">${d.value}</div>
      <div class="bar" style="height:${height}px;background:${color};"></div>
      <div class="bar-label">${esc(d.label)}</div>
    </div>`
  }).join('\n')

  return `<div class="card">
  <h2>${esc(props.title || 'Chart')}</h2>
  <div class="bar-chart">${barsHtml}</div>
  ${props.xLabel ? `<div style="text-align:center;font-size:12px;color:#6b7280;margin-top:8px;">${esc(props.xLabel)}</div>` : ''}
</div>`
}

function renderTracker(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    items: Array<{ name: string; icon?: string; target?: number }>
    period: string
    showStreak: boolean
  }

  const fnName = `tracker_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const itemsJson = JSON.stringify(props.items || [])

  return `<div class="card">
  <h2>${esc(props.title || 'Tracker')}</h2>
  <div style="font-size:12px;color:#6b7280;margin-bottom:12px;text-transform:capitalize;">${esc(props.period || 'daily')} tracker</div>
  <div class="tracker-grid" id="tracker-${esc(p.id)}"></div>
</div>
<script>
(function(){
  var items = ${itemsJson};
  var done = {};
  function render() {
    var html = items.map(function(it, i) {
      var isDone = done[i];
      return '<div class="tracker-item">' +
        '<div class="name">' + (it.icon||'') + ' ' + it.name + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        ${props.showStreak ? "'<span class=\"streak\">' + (isDone ? '🔥 1' : '0') + '</span>' +" : "''+"}
        '<button class=\"tracker-btn' + (isDone?' done':'') + '\" onclick=\"${fnName}_toggle('+i+')\">' + (isDone?'✓':'+') + '</button>' +
        '</div></div>';
    }).join('');
    document.getElementById('tracker-${p.id}').innerHTML = html;
  }
  window.${fnName}_toggle = function(i) { done[i] = !done[i]; render(); };
  render();
})();
</script>`
}

function renderSplitCalculator(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    currency: string
    defaultTipPercentages: number[]
    maxPeople: number
    showPerPersonBreakdown: boolean
    showTipAmount: boolean
    showTotal: boolean
  }

  const fnName = `split_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const tips = props.defaultTipPercentages || [15, 18, 20, 25]
  const currency = props.currency || '$'

  const presetBtns = tips
    .map((t, i) => `<button onclick="${fnName}_tip(${t}, ${i})" ${i === 0 ? 'class="active"' : ''}>${t}%</button>`)
    .join('')

  return `<div class="card">
  <h2>${esc(props.title || 'Tip Calculator')}</h2>
  <label>Bill Amount (${esc(currency)})</label>
  <input type="number" id="${esc(p.id)}-bill" value="50" min="0" step="0.01" oninput="${fnName}_calc()" />
  <label>Tip Percentage</label>
  <div class="tip-presets" id="${esc(p.id)}-presets">${presetBtns}</div>
  <label>Number of People</label>
  <input type="number" id="${esc(p.id)}-people" value="2" min="1" max="${props.maxPeople || 20}" oninput="${fnName}_calc()" />
  <div class="split-results">
    ${props.showTipAmount !== false ? `<div class="split-result-box"><div class="label">Tip Amount</div><div class="value" id="${esc(p.id)}-tip">${esc(currency)}0.00</div></div>` : ''}
    ${props.showTotal !== false ? `<div class="split-result-box"><div class="label">Total</div><div class="value" id="${esc(p.id)}-total">${esc(currency)}0.00</div></div>` : ''}
    ${props.showPerPersonBreakdown !== false ? `<div class="split-result-box"><div class="label">Per Person</div><div class="value" id="${esc(p.id)}-pp">${esc(currency)}0.00</div></div>` : ''}
  </div>
</div>
<script>
(function(){
  var tipPct = ${tips[0] || 18};
  window.${fnName}_tip = function(pct, idx) {
    tipPct = pct;
    document.querySelectorAll('#${p.id} .tip-presets button').forEach(function(b,i){b.className=i===idx?'active':'';});
    ${fnName}_calc();
  };
  window.${fnName}_calc = function() {
    var bill = parseFloat(document.getElementById('${p.id}-bill').value) || 0;
    var people = parseInt(document.getElementById('${p.id}-people').value) || 1;
    var tip = bill * tipPct / 100;
    var total = bill + tip;
    var pp = total / people;
    var el;
    el = document.getElementById('${p.id}-tip'); if(el) el.textContent = '${currency}' + tip.toFixed(2);
    el = document.getElementById('${p.id}-total'); if(el) el.textContent = '${currency}' + total.toFixed(2);
    el = document.getElementById('${p.id}-pp'); if(el) el.textContent = '${currency}' + pp.toFixed(2);
  };
  ${fnName}_calc();
})();
</script>`
}

function renderConverter(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    categories: Array<{ name: string; units: Array<{ name: string; symbol: string; toBase: number; formula?: string }> }>
    defaultCategory: string
    precision: number
  }

  const fnName = `conv_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const catsJson = JSON.stringify(props.categories || [])
  const defaultCat = props.defaultCategory || (props.categories?.[0]?.name ?? 'Length')
  const precision = props.precision ?? 4

  const catBtns = (props.categories || []).map((c, i) =>
    `<button onclick="${fnName}_cat('${esc(c.name)}', ${i})" ${c.name === defaultCat ? 'class="active"' : ''}>${esc(c.name)}</button>`
  ).join('')

  return `<div class="card">
  <h2>${esc(props.title || 'Converter')}</h2>
  <div class="converter-cats" id="${esc(p.id)}-cats">${catBtns}</div>
  <div class="converter-row">
    <input type="number" id="${esc(p.id)}-val" value="1" step="any" oninput="${fnName}_convert()" />
    <select id="${esc(p.id)}-from" onchange="${fnName}_convert()"></select>
  </div>
  <div style="text-align:center;margin:4px 0;font-size:18px;color:#6b7280;">↓</div>
  <div class="converter-row">
    <input type="number" id="${esc(p.id)}-result" readonly style="background:#f9fafb;font-weight:600;" />
    <select id="${esc(p.id)}-to" onchange="${fnName}_convert()"></select>
  </div>
</div>
<script>
(function(){
  var cats = ${catsJson};
  var currentCat = '${esc(defaultCat)}';
  function getUnits() { return (cats.find(function(c){return c.name===currentCat;})||{units:[]}).units; }
  function populateSelects() {
    var units = getUnits();
    var opts = units.map(function(u,i){return '<option value="'+i+'">'+u.name+' ('+u.symbol+')</option>';}).join('');
    document.getElementById('${p.id}-from').innerHTML = opts;
    var toEl = document.getElementById('${p.id}-to');
    toEl.innerHTML = opts;
    if(units.length > 1) toEl.selectedIndex = 1;
  }
  window.${fnName}_cat = function(name, idx) {
    currentCat = name;
    document.querySelectorAll('#${p.id} .converter-cats button').forEach(function(b,i){b.className=i===idx?'active':'';});
    populateSelects();
    ${fnName}_convert();
  };
  window.${fnName}_convert = function() {
    var val = parseFloat(document.getElementById('${p.id}-val').value) || 0;
    var units = getUnits();
    var fromIdx = parseInt(document.getElementById('${p.id}-from').value);
    var toIdx = parseInt(document.getElementById('${p.id}-to').value);
    var fromU = units[fromIdx], toU = units[toIdx];
    if(!fromU || !toU) return;
    var baseVal;
    if(currentCat === 'Temperature') {
      if(fromU.symbol === '°F') baseVal = (val - 32) * 5/9;
      else if(fromU.symbol === 'K') baseVal = val - 273.15;
      else baseVal = val;
      var result;
      if(toU.symbol === '°F') result = baseVal * 9/5 + 32;
      else if(toU.symbol === 'K') result = baseVal + 273.15;
      else result = baseVal;
      document.getElementById('${p.id}-result').value = result.toFixed(${precision});
    } else {
      baseVal = val * fromU.toBase;
      var result = baseVal / toU.toBase;
      document.getElementById('${p.id}-result').value = result.toFixed(${precision});
    }
  };
  populateSelects();
  ${fnName}_convert();
})();
</script>`
}

function renderPoll(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    question: string
    options: Array<{ label: string; votes: number }>
    allowMultiple: boolean
    showResults: boolean
    showPercentages: boolean
  }

  const fnName = `poll_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const optionsJson = JSON.stringify(props.options || [])

  return `<div class="card">
  <h2>${esc(props.title || 'Poll')}</h2>
  <p style="font-size:16px;font-weight:600;margin-bottom:16px;">${esc(props.question || 'What do you think?')}</p>
  <div id="${esc(p.id)}-options"></div>
  <div id="${esc(p.id)}-total" style="font-size:12px;color:#6b7280;text-align:center;margin-top:12px;"></div>
</div>
<script>
(function(){
  var options = ${optionsJson};
  var voted = -1;
  function render() {
    var total = options.reduce(function(s,o){return s+o.votes;},0);
    var html = options.map(function(o, i) {
      var pct = total > 0 ? (o.votes/total*100) : 0;
      var cls = 'poll-option' + (voted===i?' voted':'');
      var barW = voted >= 0 ? pct : 0;
      return '<div class="'+cls+'" onclick="${fnName}_vote('+i+')">' +
        '<div class="poll-bar" style="width:'+barW.toFixed(1)+'%"></div>' +
        '<span class="poll-label">'+o.label+'</span>' +
        (voted >= 0 ? '<span class="poll-pct">'+pct.toFixed(1)+'%</span>' : '') +
        '</div>';
    }).join('');
    document.getElementById('${p.id}-options').innerHTML = html;
    document.getElementById('${p.id}-total').textContent = voted >= 0 ? total + ' votes' : '';
  }
  window.${fnName}_vote = function(i) {
    if(voted >= 0) return;
    voted = i;
    options[i].votes++;
    render();
  };
  render();
})();
</script>`
}

function renderPricingTable(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    subtitle?: string
    tiers: Array<{
      name: string; price: number; period: string; description: string
      features: string[]; highlighted: boolean; ctaLabel: string
    }>
    showAnnualToggle: boolean
    annualDiscount: number
  }

  const fnName = `pricing_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const discount = props.annualDiscount || 20

  const tiersHtml = (props.tiers || []).map((tier) => {
    const featuresHtml = tier.features.map((f) => `<li>${esc(f)}</li>`).join('')
    const priceId = `${p.id}-price-${tier.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    return `<div class="pricing-tier${tier.highlighted ? ' highlighted' : ''}">
      <div class="tier-name">${esc(tier.name)}</div>
      <div class="tier-desc">${esc(tier.description)}</div>
      <div class="tier-price" id="${esc(priceId)}">$${tier.price}<span>/${esc(tier.period)}</span></div>
      <ul class="features">${featuresHtml}</ul>
      <button>${esc(tier.ctaLabel || 'Get Started')}</button>
    </div>`
  }).join('\n')

  const toggleHtml = props.showAnnualToggle
    ? `<div class="pricing-toggle">
        <span>Monthly</span>
        <div class="toggle" id="${esc(p.id)}-toggle" onclick="${fnName}_toggle()"></div>
        <span>Annual <span style="color:#16a34a;font-weight:600;">(-${discount}%)</span></span>
      </div>`
    : ''

  const tierPrices = JSON.stringify((props.tiers || []).map((t) => ({ name: t.name, price: t.price })))

  return `<div class="card" style="background:transparent;box-shadow:none;padding:0;">
  <div style="text-align:center;margin-bottom:24px;">
    <h2 style="font-size:28px;">${esc(props.title || 'Pricing')}</h2>
    ${props.subtitle ? `<p style="color:#6b7280;margin-top:4px;">${esc(props.subtitle)}</p>` : ''}
  </div>
  ${toggleHtml}
  <div class="pricing-tiers">${tiersHtml}</div>
</div>
${props.showAnnualToggle ? `<script>
(function(){
  var annual = false;
  var tiers = ${tierPrices};
  var discount = ${discount};
  window.${fnName}_toggle = function() {
    annual = !annual;
    var el = document.getElementById('${p.id}-toggle');
    el.className = annual ? 'toggle active' : 'toggle';
    tiers.forEach(function(t) {
      var priceEl = document.getElementById('${p.id}-price-' + t.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if(!priceEl) return;
      var price = annual ? Math.round(t.price * (100 - discount) / 100) : t.price;
      priceEl.innerHTML = '$' + price + '<span>/' + (annual ? 'year' : 'month') + '</span>';
    });
  };
})();
</script>` : ''}`
}

function renderKanbanBoard(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    columns: Array<{
      id: string; title: string; color: string
      cards: Array<{ id: string; title: string; description?: string; priority?: string; tags?: string[] }>
    }>
    allowDrag: boolean
    showPriority: boolean
    showTags: boolean
  }

  const columnsHtml = (props.columns || []).map((col) => {
    const cardsHtml = (col.cards || []).map((card) => {
      const tagsHtml = props.showTags && card.tags
        ? `<div class="tags">${card.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
        : ''
      const priorityHtml = props.showPriority && card.priority
        ? `<span class="priority ${card.priority}">${esc(card.priority)}</span>`
        : ''
      return `<div class="kanban-card" draggable="${props.allowDrag !== false}" style="border-left-color:${esc(col.color)}">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
          <h4>${esc(card.title)}</h4>
          ${priorityHtml}
        </div>
        ${card.description ? `<p>${esc(card.description)}</p>` : ''}
        ${tagsHtml}
      </div>`
    }).join('\n')

    return `<div class="kanban-col">
      <div class="kanban-col-header" style="border-bottom-color:${esc(col.color)}">
        <h3 style="color:${esc(col.color)}">${esc(col.title)}</h3>
        <span class="count">${col.cards?.length || 0}</span>
      </div>
      ${cardsHtml}
    </div>`
  }).join('\n')

  return `<div class="card" style="padding:12px;background:transparent;box-shadow:none;">
  <h2 style="margin-bottom:16px;">${esc(props.title || 'Board')}</h2>
  <div class="kanban">${columnsHtml}</div>
</div>`
}

function renderStatsDashboard(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    stats: Array<{ label: string; value: string; change: number; changeLabel?: string; icon?: string }>
    charts?: Array<{ type: string; title: string; data: Array<{ label: string; value: number }> }>
  }

  const statsHtml = (props.stats || []).map((s) => {
    const changeClass = s.change >= 0 ? 'positive' : 'negative'
    const arrow = s.change >= 0 ? '↑' : '↓'
    return `<div class="stat-card">
      <div class="stat-label">${esc(s.label)}</div>
      <div class="stat-value">${esc(s.value)}</div>
      <div class="stat-change ${changeClass}">${arrow} ${Math.abs(s.change)}% ${esc(s.changeLabel || '')}</div>
    </div>`
  }).join('\n')

  let chartsHtml = ''
  if (props.charts && props.charts.length > 0) {
    chartsHtml = props.charts.map((chart) => {
      const data = chart.data || []
      const maxVal = Math.max(...data.map((d) => d.value), 1)
      const points = data.map((d, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50
        const y = 100 - (d.value / maxVal) * 80 - 10
        return `${x},${y}`
      }).join(' ')

      const labels = data.map((d, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50
        return `<text x="${x}%" y="98%" text-anchor="middle" font-size="10" fill="#6b7280">${esc(d.label)}</text>`
      }).join('')

      return `<div class="line-chart-container">
        <h3>${esc(chart.title)}</h3>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:150px;">
          <polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5" style="color:inherit" />
          ${labels}
        </svg>
      </div>`
    }).join('\n')
  }

  return `<div class="card" style="background:transparent;box-shadow:none;padding:0;">
  <h2 style="margin-bottom:16px;">${esc(props.title || 'Dashboard')}</h2>
  <div class="stats-grid">${statsHtml}</div>
  ${chartsHtml}
</div>`
}

function renderWizardForm(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    steps: Array<{ title: string; fields: Array<{ name: string; label: string; type: string; placeholder?: string; required?: boolean; defaultValue?: unknown; options?: string[] }> }>
    submitLabel: string
    showStepIndicator: boolean
    allowBackNavigation: boolean
  }

  const fnName = `wizard_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const steps = props.steps || []

  const stepsIndicator = props.showStepIndicator
    ? `<div class="wizard-steps" id="${esc(p.id)}-steps">${steps.map((_, i) => `<div class="wizard-step${i === 0 ? ' active' : ''}" id="${esc(p.id)}-step-ind-${i}"></div>`).join('')}</div>`
    : ''

  const stepsHtml = steps.map((step, si) => {
    const fieldsHtml = step.fields.map((f) => {
      if (f.type === 'textarea') {
        return `<label>${esc(f.label)}${f.required ? ' *' : ''}</label><textarea name="${esc(f.name)}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'required' : ''}></textarea>`
      }
      if (f.type === 'select' && f.options) {
        const opts = f.options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')
        return `<label>${esc(f.label)}${f.required ? ' *' : ''}</label><select name="${esc(f.name)}" ${f.required ? 'required' : ''}><option value="">Select...</option>${opts}</select>`
      }
      return `<label>${esc(f.label)}${f.required ? ' *' : ''}</label><input type="${f.type || 'text'}" name="${esc(f.name)}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'required' : ''} ${f.defaultValue !== undefined ? `value="${f.defaultValue}"` : ''} />`
    }).join('\n')

    const isLast = si === steps.length - 1
    const backBtn = props.allowBackNavigation && si > 0
      ? `<button class="btn-back" onclick="${fnName}_go(${si - 1})">Back</button>`
      : ''
    const nextBtn = isLast
      ? `<button onclick="${fnName}_submit()">${esc(props.submitLabel || 'Submit')}</button>`
      : `<button onclick="${fnName}_go(${si + 1})">Next</button>`

    return `<div class="wizard-page" id="${esc(p.id)}-page-${si}" style="${si > 0 ? 'display:none;' : ''}">
      <div class="wizard-step-title">${esc(step.title)}</div>
      ${fieldsHtml}
      <div class="wizard-nav">${backBtn}${nextBtn}</div>
    </div>`
  }).join('\n')

  return `<div class="card">
  <h2>${esc(props.title || 'Form')}</h2>
  ${stepsIndicator}
  ${stepsHtml}
  <div id="${esc(p.id)}-success" style="display:none;text-align:center;padding:24px;">
    <div style="font-size:48px;margin-bottom:12px;">✓</div>
    <div style="font-size:18px;font-weight:600;">Complete!</div>
    <p style="color:#6b7280;margin-top:4px;">Your form has been submitted successfully.</p>
  </div>
</div>
<script>
(function(){
  var current = 0, total = ${steps.length};
  window.${fnName}_go = function(step) {
    document.getElementById('${p.id}-page-' + current).style.display = 'none';
    document.getElementById('${p.id}-page-' + step).style.display = '';
    for(var i=0;i<total;i++) {
      var ind = document.getElementById('${p.id}-step-ind-' + i);
      if(ind) ind.className = 'wizard-step' + (i < step ? ' completed' : i === step ? ' active' : '');
    }
    current = step;
  };
  window.${fnName}_submit = function() {
    document.getElementById('${p.id}-page-' + current).style.display = 'none';
    document.querySelectorAll('#${p.id} .wizard-steps').forEach(function(e){e.style.display='none';});
    document.getElementById('${p.id}-success').style.display = '';
  };
})();
</script>`
}

function renderRealtimeCollab(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    placeholder: string
    collaborators: Array<{ name: string; color: string; avatar?: string }>
    showToolbar: boolean
    initialContent: string
  }

  const fnName = `collab_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const collabs = props.collaborators || [
    { name: 'Alice', color: '#7c3aed' },
    { name: 'Bob', color: '#3b82f6' },
  ]
  const collabsJson = JSON.stringify(collabs)

  const avatarsHtml = collabs.map((c) =>
    `<div class="collab-avatar" style="background:${esc(c.color)}"><span class="dot"></span>${esc(c.avatar || c.name.charAt(0))} ${esc(c.name)}</div>`
  ).join('')

  const toolbarHtml = props.showToolbar !== false
    ? `<div class="collab-toolbar">
        <button onclick="${fnName}_format('bold')" title="Bold"><b>B</b></button>
        <button onclick="${fnName}_format('italic')" title="Italic"><i>I</i></button>
        <button onclick="${fnName}_format('underline')" title="Underline"><u>U</u></button>
        <button onclick="${fnName}_format('insertUnorderedList')" title="List">• List</button>
        <div class="collab-status"><span class="live-dot"></span>Live</div>
      </div>`
    : ''

  return `<div class="card">
  <h2>${esc(props.title || 'Collaborative Document')}</h2>
  <div class="collab-presence">${avatarsHtml}</div>
  ${toolbarHtml}
  <div class="collab-editor" id="${esc(p.id)}-editor" contenteditable="true">${esc(props.initialContent || props.placeholder || 'Start typing...')}</div>
</div>
<script>
(function(){
  var collabs = ${collabsJson};
  var editor = document.getElementById('${p.id}-editor');
  var cursors = [];

  window.${fnName}_format = function(cmd) {
    document.execCommand(cmd, false, null);
    editor.focus();
  };

  function addCursor(collab, pos) {
    var cursor = document.createElement('div');
    cursor.className = 'collab-cursor';
    cursor.style.background = collab.color;
    cursor.style.left = pos.x + 'px';
    cursor.style.top = pos.y + 'px';
    var label = document.createElement('div');
    label.className = 'collab-cursor-label';
    label.style.background = collab.color;
    label.textContent = collab.name;
    cursor.appendChild(label);
    editor.appendChild(cursor);
    cursors.push(cursor);
    return cursor;
  }

  function simulateCursors() {
    cursors.forEach(function(c) { if(c.parentNode) c.parentNode.removeChild(c); });
    cursors = [];
    var rect = editor.getBoundingClientRect();
    var edW = editor.offsetWidth - 20;
    var edH = editor.offsetHeight - 20;
    collabs.forEach(function(c) {
      var x = 10 + Math.random() * edW;
      var y = 10 + Math.random() * (edH > 30 ? edH : 30);
      addCursor(c, {x: x, y: y});
    });
  }

  simulateCursors();
  setInterval(simulateCursors, 3000);
})();
</script>`
}

function renderAiChat(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    botName: string
    botAvatar: string
    placeholder: string
    welcomeMessage: string
    responses: Array<{ trigger: string; reply: string }>
    defaultReply: string
  }

  const fnName = `chat_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const responsesJson = JSON.stringify(props.responses || [])

  return `<div class="card" style="padding:0;overflow:hidden;">
  <div class="chat-container">
    <div class="chat-header">
      <div class="avatar">${esc(props.botAvatar || '🤖')}</div>
      <div class="info">
        <h3>${esc(props.botName || props.title || 'AI Assistant')}</h3>
        <p>Online</p>
      </div>
    </div>
    <div class="chat-messages" id="${esc(p.id)}-msgs">
      <div class="chat-msg bot">${esc(props.welcomeMessage || 'Hello! How can I help you today?')}</div>
    </div>
    <div class="chat-input-row">
      <input type="text" id="${esc(p.id)}-input" placeholder="${esc(props.placeholder || 'Type a message...')}" onkeydown="if(event.key==='Enter'){${fnName}_send()}" />
      <button onclick="${fnName}_send()">↑</button>
    </div>
  </div>
</div>
<script>
(function(){
  var responses = ${responsesJson};
  var defaultReply = ${JSON.stringify(props.defaultReply || "I understand your question. Let me think about that for a moment... Based on my analysis, I'd recommend exploring this topic further. Is there anything specific you'd like me to elaborate on?")};
  var msgs = document.getElementById('${p.id}-msgs');

  function addMsg(text, cls) {
    var div = document.createElement('div');
    div.className = 'chat-msg ' + cls;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.id = '${p.id}-typing';
    div.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('${p.id}-typing');
    if(el) el.parentNode.removeChild(el);
  }

  function streamReply(text) {
    showTyping();
    setTimeout(function() {
      removeTyping();
      var div = document.createElement('div');
      div.className = 'chat-msg bot';
      msgs.appendChild(div);
      var idx = 0;
      var iv = setInterval(function() {
        idx += 1 + Math.floor(Math.random() * 2);
        if(idx >= text.length) { idx = text.length; clearInterval(iv); }
        div.textContent = text.substring(0, idx);
        msgs.scrollTop = msgs.scrollHeight;
      }, 30);
    }, 800 + Math.random() * 600);
  }

  function findReply(input) {
    var lower = input.toLowerCase();
    for(var i = 0; i < responses.length; i++) {
      if(lower.indexOf(responses[i].trigger.toLowerCase()) >= 0) return responses[i].reply;
    }
    return defaultReply;
  }

  window.${fnName}_send = function() {
    var inp = document.getElementById('${p.id}-input');
    var text = inp.value.trim();
    if(!text) return;
    inp.value = '';
    addMsg(text, 'user');
    streamReply(findReply(text));
  };
})();
</script>`
}

function renderPaymentForm(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    currency: string
    items: Array<{ label: string; amount: number }>
    submitLabel: string
    showSummary: boolean
    successMessage: string
  }

  const fnName = `pay_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const currency = props.currency || '$'
  const items = props.items || [{ label: 'Item', amount: 0 }]
  const total = items.reduce((s, i) => s + i.amount, 0)

  const summaryHtml = props.showSummary !== false
    ? `<div class="payment-summary">
        ${items.map((i) => `<div class="line"><span>${esc(i.label)}</span><span>${esc(currency)}${i.amount.toFixed(2)}</span></div>`).join('\n')}
        <div class="line total"><span>Total</span><span>${esc(currency)}${total.toFixed(2)}</span></div>
      </div>`
    : ''

  return `<div class="card payment-form">
  <h2>${esc(props.title || 'Payment')}</h2>
  ${summaryHtml}
  <label>Card Number</label>
  <div class="payment-card-frame">
    <span class="card-icon">💳</span>
    <input type="text" id="${esc(p.id)}-card" placeholder="1234 5678 9012 3456" maxlength="19" oninput="${fnName}_formatCard(this)" />
  </div>
  <div class="payment-row">
    <div>
      <label>Expiry</label>
      <input type="text" id="${esc(p.id)}-exp" placeholder="MM / YY" maxlength="7" oninput="${fnName}_formatExp(this)" />
    </div>
    <div>
      <label>CVC</label>
      <input type="text" id="${esc(p.id)}-cvc" placeholder="123" maxlength="4" />
    </div>
  </div>
  <label>Cardholder Name</label>
  <input type="text" id="${esc(p.id)}-name" placeholder="Full name on card" />
  <button onclick="${fnName}_submit()" id="${esc(p.id)}-btn">${esc(props.submitLabel || 'Pay ' + currency + total.toFixed(2))}</button>
  <div class="payment-secure"><span class="lock">🔒</span> Secured with 256-bit encryption</div>
  <div id="${esc(p.id)}-success" style="display:none;text-align:center;padding:24px;">
    <div style="font-size:48px;margin-bottom:12px;">✅</div>
    <div style="font-size:18px;font-weight:600;">${esc(props.successMessage || 'Payment Successful!')}</div>
    <p style="color:#6b7280;margin-top:4px;">Your payment of ${esc(currency)}${total.toFixed(2)} has been processed.</p>
  </div>
</div>
<script>
(function(){
  window.${fnName}_formatCard = function(el) {
    var v = el.value.replace(/\\D/g, '').substring(0, 16);
    el.value = v.replace(/(\\d{4})(?=\\d)/g, '$1 ');
  };
  window.${fnName}_formatExp = function(el) {
    var v = el.value.replace(/\\D/g, '').substring(0, 4);
    if(v.length >= 3) v = v.substring(0,2) + ' / ' + v.substring(2);
    el.value = v;
  };
  window.${fnName}_submit = function() {
    var card = document.getElementById('${p.id}-card').value.replace(/\\s/g, '');
    var exp = document.getElementById('${p.id}-exp').value;
    var cvc = document.getElementById('${p.id}-cvc').value;
    var name = document.getElementById('${p.id}-name').value;
    if(card.length < 13 || !exp || !cvc || !name) { alert('Please fill in all fields.'); return; }
    var btn = document.getElementById('${p.id}-btn');
    btn.disabled = true; btn.textContent = 'Processing...';
    setTimeout(function() {
      btn.style.display = 'none';
      document.querySelector('#${p.id} .payment-form') && (document.querySelectorAll('#${p.id} label, #${p.id} input, #${p.id} .payment-card-frame, #${p.id} .payment-row, #${p.id} .payment-secure').forEach(function(e){e.style.display='none';}));
      document.getElementById('${p.id}-success').style.display = '';
    }, 1500);
  };
})();
</script>`
}

function renderAnalyticsDashboard(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    kpis: Array<{ label: string; value: string; trend: number; trendLabel?: string; icon?: string }>
    charts: Array<{ title: string; type: 'bar' | 'line' | 'pie'; data: Array<{ label: string; value: number; color?: string }> }>
    timeRanges: string[]
    defaultRange: string
  }

  const fnName = `analytics_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const ranges = props.timeRanges || ['7d', '30d', '90d', '1y']
  const defaultRange = props.defaultRange || ranges[0]
  const defaultColors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const kpisHtml = (props.kpis || []).map((k) => {
    const trendClass = k.trend >= 0 ? 'up' : 'down'
    const arrow = k.trend >= 0 ? '↑' : '↓'
    return `<div class="analytics-kpi">
      <div class="kpi-header"><span class="kpi-label">${esc(k.label)}</span>${k.icon ? `<span class="kpi-icon">${k.icon}</span>` : ''}</div>
      <div class="kpi-value">${esc(k.value)}</div>
      <div class="kpi-trend ${trendClass}">${arrow} ${Math.abs(k.trend)}% ${esc(k.trendLabel || '')}</div>
    </div>`
  }).join('\n')

  const tabsHtml = `<div class="analytics-tabs" id="${esc(p.id)}-tabs">${ranges.map((r) =>
    `<button onclick="${fnName}_range('${esc(r)}')" ${r === defaultRange ? 'class="active"' : ''}>${esc(r)}</button>`
  ).join('')}</div>`

  const chartsHtml = (props.charts || []).map((chart, ci) => {
    const data = chart.data || []
    if (chart.type === 'pie') {
      let cumPct = 0
      const total = data.reduce((s, d) => s + d.value, 0) || 1
      const segments = data.map((d, i) => {
        const pct = (d.value / total) * 100
        const start = cumPct
        cumPct += pct
        return `${d.color || defaultColors[i % defaultColors.length]} ${start}% ${cumPct}%`
      })
      const legend = data.map((d, i) => {
        const color = d.color || defaultColors[i % defaultColors.length]
        const pct = ((d.value / total) * 100).toFixed(1)
        return `<div style="display:flex;align-items:center;gap:6px;font-size:12px;"><div style="width:10px;height:10px;border-radius:3px;background:${color};"></div>${esc(d.label)}: ${pct}%</div>`
      }).join('')
      return `<div class="analytics-chart-card">
        <h3>${esc(chart.title)}</h3>
        <div style="display:flex;align-items:center;gap:20px;">
          <div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(${segments.join(', ')});flex-shrink:0;"></div>
          <div style="display:flex;flex-direction:column;gap:4px;">${legend}</div>
        </div>
      </div>`
    }

    const maxVal = Math.max(...data.map((d) => d.value), 1)

    if (chart.type === 'line') {
      const points = data.map((d, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50
        const y = 100 - (d.value / maxVal) * 80 - 10
        return `${x},${y}`
      }).join(' ')
      const labels = data.map((d, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50
        return `<text x="${x}%" y="98%" text-anchor="middle" font-size="10" fill="#6b7280">${esc(d.label)}</text>`
      }).join('')
      return `<div class="analytics-chart-card">
        <h3>${esc(chart.title)}</h3>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:150px;">
          <polyline points="${points}" fill="none" stroke="${defaultColors[ci % defaultColors.length]}" stroke-width="1.5" />
          ${labels}
        </svg>
      </div>`
    }

    // Bar chart
    const barsHtml = data.map((d, i) => {
      const color = d.color || defaultColors[i % defaultColors.length]
      const h = Math.round((d.value / maxVal) * 120)
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="font-size:11px;font-weight:600;">${d.value}</div>
        <div style="height:${h}px;width:100%;min-width:16px;background:${color};border-radius:4px 4px 0 0;"></div>
        <div style="font-size:10px;color:#6b7280;text-align:center;">${esc(d.label)}</div>
      </div>`
    }).join('')
    return `<div class="analytics-chart-card">
      <h3>${esc(chart.title)}</h3>
      <div style="display:flex;align-items:flex-end;gap:6px;height:160px;padding-top:16px;">${barsHtml}</div>
    </div>`
  }).join('\n')

  return `<div class="card" style="background:transparent;box-shadow:none;padding:0;">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
    <h2 style="margin:0;">${esc(props.title || 'Analytics')}</h2>
    ${tabsHtml}
  </div>
  <div class="analytics-grid">${kpisHtml}</div>
  <div class="analytics-chart-grid">${chartsHtml}</div>
</div>
<script>
(function(){
  window.${fnName}_range = function(r) {
    document.querySelectorAll('#${p.id} .analytics-tabs button').forEach(function(b){
      b.className = b.textContent === r ? 'active' : '';
    });
  };
})();
</script>`
}

function renderNotificationCenter(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    notifications: Array<{ id: string; title: string; description: string; time: string; icon?: string; iconBg?: string; read?: boolean }>
    showBell: boolean
    showToast: boolean
    toastDuration: number
  }

  const fnName = `notif_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const notifs = props.notifications || []
  const notifsJson = JSON.stringify(notifs)
  const unreadCount = notifs.filter((n) => !n.read).length

  return `<div class="card">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
    <h2 style="margin:0;">${esc(props.title || 'Notifications')}</h2>
    ${props.showBell !== false ? `<button class="notif-bell" onclick="${fnName}_togglePanel()" id="${esc(p.id)}-bell">
      🔔${unreadCount > 0 ? `<span class="notif-badge" id="${esc(p.id)}-badge">${unreadCount}</span>` : `<span class="notif-badge" id="${esc(p.id)}-badge" style="display:none">0</span>`}
    </button>` : ''}
  </div>
  <div class="notif-panel" id="${esc(p.id)}-panel">
    <div class="notif-panel-header">
      <h3>Notifications</h3>
      <button onclick="${fnName}_markAll()">Mark all read</button>
    </div>
    <div id="${esc(p.id)}-list"></div>
  </div>
</div>
<div id="${esc(p.id)}-toasts"></div>
<script>
(function(){
  var notifs = ${notifsJson};
  var toastDur = ${props.toastDuration || 4000};

  function render() {
    var list = document.getElementById('${p.id}-list');
    if(!notifs.length) { list.innerHTML = '<div class="notif-empty">No notifications</div>'; return; }
    list.innerHTML = notifs.map(function(n, i) {
      var cls = 'notif-item' + (n.read ? '' : ' unread');
      var iconStyle = n.iconBg ? 'background:' + n.iconBg : 'background:#f3f4f6';
      return '<div class="' + cls + '" onclick="${fnName}_read(' + i + ')">' +
        '<div class="notif-icon" style="' + iconStyle + '">' + (n.icon || '📬') + '</div>' +
        '<div class="notif-content"><div class="notif-title">' + n.title + '</div><div class="notif-desc">' + n.description + '</div></div>' +
        '<span class="notif-time">' + n.time + '</span></div>';
    }).join('');
    updateBadge();
  }

  function updateBadge() {
    var count = notifs.filter(function(n){return !n.read;}).length;
    var badge = document.getElementById('${p.id}-badge');
    if(badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
  }

  window.${fnName}_read = function(i) {
    notifs[i].read = true;
    render();
  };

  window.${fnName}_markAll = function() {
    notifs.forEach(function(n){ n.read = true; });
    render();
  };

  window.${fnName}_togglePanel = function() {
    var panel = document.getElementById('${p.id}-panel');
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
  };

  window.${fnName}_toast = function(text) {
    var container = document.getElementById('${p.id}-toasts');
    var toast = document.createElement('div');
    toast.className = 'notif-toast';
    toast.innerHTML = '🔔 ' + text + '<button class="toast-close" onclick="this.parentNode.remove()">✕</button>';
    container.appendChild(toast);
    setTimeout(function(){ if(toast.parentNode) toast.remove(); }, toastDur);
  };

  render();
  ${props.showToast !== false ? `setTimeout(function(){ ${fnName}_toast('New notification received!'); }, 2000);` : ''}
})();
</script>`
}

// ---------------------------------------------------------------------------
// New renderers — previously missing, causing silent Stage-3 failures
// ---------------------------------------------------------------------------

function renderCalendar(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    mode: string
    minDate?: string
    maxDate?: string
    highlightedDates?: Array<{ date: string; label: string; color?: string }>
    firstDayOfWeek?: number
    showWeekNumbers?: boolean
  }

  const fnName = `cal_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const highlighted = props.highlightedDates || []
  const highlightedJson = JSON.stringify(highlighted)
  const firstDay = props.firstDayOfWeek ?? 0
  const dayLabels = firstDay === 1
    ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const dayHeaderHtml = dayLabels.map((d) => `<div style="text-align:center;font-size:12px;font-weight:600;color:#6b7280;padding:4px 0;">${d}</div>`).join('')

  return `<div class="card">
  <h2>${esc(props.title || 'Calendar')}</h2>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
    <button onclick="${fnName}_prev()" style="width:36px;height:36px;padding:0;background:#f3f4f6;color:#374151;border-radius:8px;font-size:18px;">‹</button>
    <div id="${esc(p.id)}-month-label" style="font-weight:600;font-size:15px;"></div>
    <button onclick="${fnName}_next()" style="width:36px;height:36px;padding:0;background:#f3f4f6;color:#374151;border-radius:8px;font-size:18px;">›</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
    ${dayHeaderHtml}
    <div id="${esc(p.id)}-grid" style="display:contents;"></div>
  </div>
  <div id="${esc(p.id)}-selection" style="margin-top:12px;font-size:13px;color:#6b7280;min-height:20px;"></div>
</div>
<script>
(function(){
  var highlighted = ${highlightedJson};
  var highlightMap = {};
  highlighted.forEach(function(h){ highlightMap[h.date] = h; });
  var today = new Date();
  var year = today.getFullYear(), month = today.getMonth();
  var selected = [], mode = '${esc(props.mode || 'single')}';
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var firstDay = ${firstDay};

  function toISO(y, m, d) {
    return y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
  }

  function render() {
    document.getElementById('${p.id}-month-label').textContent = MONTHS[month] + ' ' + year;
    var grid = document.getElementById('${p.id}-grid');
    var first = new Date(year, month, 1).getDay();
    var offset = (first - firstDay + 7) % 7;
    var days = new Date(year, month + 1, 0).getDate();
    var html = '';
    for (var i = 0; i < offset; i++) html += '<div></div>';
    for (var d = 1; d <= days; d++) {
      var iso = toISO(year, month, d);
      var isToday = (iso === toISO(today.getFullYear(), today.getMonth(), today.getDate()));
      var isSel = selected.indexOf(iso) >= 0;
      var hl = highlightMap[iso];
      var style = 'cursor:pointer;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:13px;margin:auto;';
      if (isSel) style += 'background:currentColor;color:#fff;';
      else if (isToday) style += 'border:2px solid currentColor;font-weight:700;';
      else if (hl) style += 'background:' + (hl.color || '#fef9c3') + ';';
      html += '<div style="' + style + '" onclick="${fnName}_click(\\'' + iso + '\\')" title="' + (hl ? hl.label : '') + '">' + d + '</div>';
    }
    grid.innerHTML = html;
    var selEl = document.getElementById('${p.id}-selection');
    if (selected.length) selEl.textContent = mode === 'range' && selected.length === 2 ? selected[0] + ' → ' + selected[1] : 'Selected: ' + selected.join(', ');
    else selEl.textContent = '';
  }

  window.${fnName}_prev = function() { month--; if(month<0){month=11;year--;} render(); };
  window.${fnName}_next = function() { month++; if(month>11){month=0;year++;} render(); };
  window.${fnName}_click = function(iso) {
    if (mode === 'range') {
      if (selected.length === 0 || selected.length === 2) selected = [iso];
      else { selected.push(iso); selected.sort(); }
    } else {
      selected = [iso];
    }
    render();
  };
  render();
})();
</script>`
}

function renderProgressBar(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    mode: string
    value?: number
    showPercentage?: boolean
    animated?: boolean
    striped?: boolean
    size?: string
    steps?: Array<{ label: string; description?: string }>
    currentStep?: number
    allowClickNavigation?: boolean
  }

  const fnName = `prog_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const mode = props.mode || 'bar'
  const height = props.size === 'sm' ? '6px' : props.size === 'lg' ? '16px' : '10px'

  if (mode === 'stepper') {
    const steps = props.steps || []
    const current = props.currentStep ?? 0
    const stepsHtml = steps.map((s, i) => {
      const state = i < current ? 'completed' : i === current ? 'active' : 'pending'
      const bg = state === 'completed' ? 'currentColor' : state === 'active' ? 'currentColor' : '#e5e7eb'
      const textColor = state === 'pending' ? '#6b7280' : '#fff'
      const clickable = props.allowClickNavigation ? ` onclick="${fnName}_goto(${i})" style="cursor:pointer;"` : ''
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;"${clickable}>
        <div style="width:32px;height:32px;border-radius:50%;background:${bg};color:${textColor};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;transition:background 0.3s;">${state === 'completed' ? '✓' : i + 1}</div>
        <div style="text-align:center;">
          <div style="font-size:13px;font-weight:600;color:${state === 'pending' ? '#9ca3af' : '#1a1a1a'};">${esc(s.label)}</div>
          ${s.description ? `<div style="font-size:11px;color:#9ca3af;">${esc(s.description)}</div>` : ''}
        </div>
      </div>
      ${i < steps.length - 1 ? `<div style="flex:none;width:40px;height:2px;background:${i < current ? 'currentColor' : '#e5e7eb'};margin-top:16px;"></div>` : ''}`
    }).join('')
    return `<div class="card">
  <h2>${esc(props.title || 'Steps')}</h2>
  <div id="${esc(p.id)}-stepper" style="display:flex;align-items:flex-start;gap:4px;">${stepsHtml}</div>
</div>
<script>
window.${fnName}_goto = function(step) {
  var items = document.querySelectorAll('#${p.id}-stepper > div:not([style*="width:40px"])');
  items.forEach(function(el, i) {
    var circle = el.querySelector('div:first-child');
    if (!circle) return;
    if (i < step) { circle.style.background='currentColor'; circle.textContent='✓'; circle.style.color='#fff'; }
    else if (i === step) { circle.style.background='currentColor'; circle.textContent=i+1; circle.style.color='#fff'; }
    else { circle.style.background='#e5e7eb'; circle.textContent=i+1; circle.style.color='#6b7280'; }
  });
};
</script>`
  }

  const value = props.value ?? 50
  const stripeStyle = props.striped ? 'background-image:repeating-linear-gradient(-45deg,rgba(255,255,255,0.15) 0,rgba(255,255,255,0.15) 6px,transparent 6px,transparent 12px);' : ''
  const animStyle = props.animated ? 'transition:width 1s ease;' : ''

  return `<div class="card">
  <h2>${esc(props.title || 'Progress')}</h2>
  <div style="background:#e5e7eb;border-radius:999px;height:${height};overflow:hidden;position:relative;">
    <div id="${esc(p.id)}-fill" style="height:100%;width:${value}%;background:currentColor;border-radius:999px;${stripeStyle}${animStyle}"></div>
  </div>
  ${props.showPercentage !== false ? `<div style="text-align:right;font-size:13px;color:#6b7280;margin-top:6px;" id="${esc(p.id)}-pct">${value}%</div>` : ''}
  <div style="display:flex;gap:8px;margin-top:12px;">
    <input type="range" min="0" max="100" value="${value}" style="flex:1;cursor:pointer;" oninput="${fnName}_set(this.value)" />
  </div>
</div>
<script>
window.${fnName}_set = function(v) {
  document.getElementById('${p.id}-fill').style.width = v + '%';
  var pct = document.getElementById('${p.id}-pct');
  if (pct) pct.textContent = v + '%';
};
</script>`
}

function renderSearch(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    placeholder?: string
    items: Array<{ label: string; value: string; category?: string; description?: string; icon?: string }>
    maxResults?: number
    showCategories?: boolean
    showRecentSearches?: boolean
  }

  const fnName = `srch_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const itemsJson = JSON.stringify(props.items || [])
  const maxResults = props.maxResults ?? 10

  return `<div class="card">
  <h2>${esc(props.title || 'Search')}</h2>
  <div style="position:relative;">
    <input type="text" id="${esc(p.id)}-input" placeholder="${esc(props.placeholder || 'Search...')}"
      style="padding-left:36px;"
      oninput="${fnName}_query(this.value)"
      onkeydown="${fnName}_key(event)"
      autocomplete="off" />
    <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:16px;color:#9ca3af;">🔍</span>
  </div>
  <div id="${esc(p.id)}-dropdown" style="display:none;border:1px solid #e5e7eb;border-radius:8px;margin-top:4px;max-height:280px;overflow-y:auto;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.08);"></div>
  <div id="${esc(p.id)}-selected" style="margin-top:12px;font-size:13px;color:#6b7280;min-height:18px;"></div>
</div>
<script>
(function(){
  var items = ${itemsJson};
  var maxResults = ${maxResults};
  var activeIdx = -1;
  var results = [];

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function renderDropdown(q) {
    var dd = document.getElementById('${p.id}-dropdown');
    if (!q) { dd.style.display = 'none'; return; }
    var q2 = q.toLowerCase();
    results = items.filter(function(it){ return it.label.toLowerCase().includes(q2) || (it.description||'').toLowerCase().includes(q2); }).slice(0, maxResults);
    if (!results.length) { dd.style.display = 'none'; return; }
    var html = '';
    ${props.showCategories ? `
    var cats = {};
    results.forEach(function(it){ var c = it.category||'Results'; if(!cats[c])cats[c]=[]; cats[c].push(it); });
    Object.keys(cats).forEach(function(cat){
      html += '<div style="padding:6px 12px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">' + esc(cat) + '</div>';
      cats[cat].forEach(function(it, i){
        var idx = results.indexOf(it);
        html += '<div onclick="${fnName}_select(' + idx + ')" style="padding:10px 12px;cursor:pointer;display:flex;gap:10px;align-items:center;" onmouseenter="activeIdx=' + idx + '"><span style="font-size:18px;">' + (it.icon||'') + '</span><div><div style="font-size:14px;font-weight:500;">' + esc(it.label) + '</div>' + (it.description ? '<div style="font-size:12px;color:#6b7280;">' + esc(it.description) + '</div>' : '') + '</div></div>';
      });
    });` : `
    results.forEach(function(it, i){
      html += '<div onclick="${fnName}_select(' + i + ')" style="padding:10px 12px;cursor:pointer;display:flex;gap:10px;align-items:center;" onmouseenter="activeIdx=' + i + '"><span style="font-size:18px;">' + (it.icon||'') + '</span><div><div style="font-size:14px;font-weight:500;">' + esc(it.label) + '</div>' + (it.description ? '<div style="font-size:12px;color:#6b7280;">' + esc(it.description) + '</div>' : '') + '</div></div>';
    });`}
    dd.innerHTML = html;
    dd.style.display = '';
    activeIdx = -1;
  }

  window.${fnName}_query = function(q) { renderDropdown(q); };

  window.${fnName}_select = function(i) {
    var it = results[i];
    if (!it) return;
    document.getElementById('${p.id}-input').value = it.label;
    document.getElementById('${p.id}-dropdown').style.display = 'none';
    document.getElementById('${p.id}-selected').textContent = 'Selected: ' + it.label + (it.value !== it.label ? ' (' + it.value + ')' : '');
  };

  window.${fnName}_key = function(e) {
    var items2 = document.querySelectorAll('#${p.id}-dropdown > div[onclick]');
    if (e.key === 'ArrowDown') { activeIdx = Math.min(activeIdx+1, items2.length-1); items2[activeIdx] && items2[activeIdx].scrollIntoView({block:'nearest'}); }
    else if (e.key === 'ArrowUp') { activeIdx = Math.max(activeIdx-1, 0); items2[activeIdx] && items2[activeIdx].scrollIntoView({block:'nearest'}); }
    else if (e.key === 'Enter' && activeIdx >= 0) { ${fnName}_select(activeIdx); }
    else if (e.key === 'Escape') { document.getElementById('${p.id}-dropdown').style.display = 'none'; }
  };

  document.addEventListener('click', function(e) {
    if (!e.target.closest('#${p.id}')) document.getElementById('${p.id}-dropdown').style.display = 'none';
  });
})();
</script>`
}

function renderAccordion(p: PrimitiveConfig): string {
  const props = p.props as {
    title: string
    sections: Array<{ id: string; title: string; content: string; icon?: string; disabled?: boolean; defaultOpen?: boolean }>
    allowMultiple?: boolean
    bordered?: boolean
    compact?: boolean
  }

  const fnName = `acc_${p.id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const allowMultiple = props.allowMultiple !== false
  const bordered = props.bordered !== false
  const padding = props.compact ? '10px 14px' : '14px 18px'
  const sections = props.sections || []

  const sectionsHtml = sections.map((s, i) => {
    const isOpen = s.defaultOpen === true
    const containerStyle = bordered
      ? 'border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:8px;'
      : 'border-bottom:1px solid #e5e7eb;'
    const disabledStyle = s.disabled ? 'opacity:0.5;pointer-events:none;' : ''
    return `<div style="${containerStyle}${disabledStyle}" id="${esc(p.id)}-sec-${i}">
      <button onclick="${fnName}_toggle(${i})" style="width:100%;background:none;border:none;padding:${padding};display:flex;align-items:center;gap:10px;cursor:pointer;color:inherit;text-align:left;font-size:15px;font-weight:500;">
        ${s.icon ? `<span style="font-size:18px;">${s.icon}</span>` : ''}
        <span style="flex:1;">${esc(s.title)}</span>
        <span id="${esc(p.id)}-icon-${i}" style="font-size:18px;transition:transform 0.2s;${isOpen ? 'transform:rotate(180deg);' : ''}">${bordered ? '∨' : '›'}</span>
      </button>
      <div id="${esc(p.id)}-body-${i}" style="overflow:hidden;max-height:${isOpen ? '1000px' : '0'};transition:max-height 0.3s ease;">
        <div style="padding:0 ${props.compact ? '14px' : '18px'} ${props.compact ? '10px' : '14px'};">${esc(s.content)}</div>
      </div>
    </div>`
  }).join('\n')

  return `<div class="card">
  <h2>${esc(props.title || 'Accordion')}</h2>
  <div id="${esc(p.id)}-accordion">${sectionsHtml}</div>
</div>
<script>
(function(){
  var allowMultiple = ${allowMultiple};
  var openSet = new Set(${JSON.stringify(sections.map((s, i) => s.defaultOpen ? i : -1).filter((i) => i >= 0))});
  var total = ${sections.length};

  window.${fnName}_toggle = function(i) {
    var body = document.getElementById('${p.id}-body-' + i);
    var icon = document.getElementById('${p.id}-icon-' + i);
    var isOpen = openSet.has(i);
    if (!allowMultiple && !isOpen) {
      openSet.forEach(function(j) {
        var b = document.getElementById('${p.id}-body-' + j);
        var ic = document.getElementById('${p.id}-icon-' + j);
        if (b) b.style.maxHeight = '0';
        if (ic) ic.style.transform = '';
        openSet.delete(j);
      });
    }
    if (isOpen) { body.style.maxHeight = '0'; if(icon) icon.style.transform = ''; openSet.delete(i); }
    else { body.style.maxHeight = '1000px'; if(icon) icon.style.transform = 'rotate(180deg)'; openSet.add(i); }
  };
})();
</script>`
}
