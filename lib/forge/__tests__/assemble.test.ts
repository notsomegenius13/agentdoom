import { describe, it, expect } from 'vitest'
import { assembleTool } from '../assemble'
import type { ToolConfig } from '../generate'

const baseTheme = {
  primaryColor: '#7c3aed',
  backgroundColor: '#fafafa',
  fontFamily: 'system-ui, sans-serif',
  borderRadius: '12px',
}

const baseLayout = {
  type: 'single-column' as const,
  maxWidth: '480px',
  padding: '24px',
}

function makeConfig(primitives: ToolConfig['primitives']): ToolConfig {
  return {
    title: 'Test Tool',
    description: 'A test tool',
    primitives,
    layout: baseLayout,
    theme: baseTheme,
  }
}

describe('Assembler: assembleTool', () => {
  it('produces valid HTML with doctype and meta tags', () => {
    const html = assembleTool(makeConfig([]))
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<meta charset="utf-8"')
    expect(html).toContain('viewport')
    expect(html).toContain('Test Tool')
    expect(html).toContain('AgentDoom')
  })

  it('renders a calculator primitive with formula', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'calculator',
          id: 'tip-calc',
          position: 0,
          props: {
            title: 'Tip Calculator',
            inputs: [
              { name: 'bill', label: 'Bill', type: 'number', defaultValue: 50 },
              { name: 'tipPct', label: 'Tip %', type: 'number', defaultValue: 18 },
            ],
            formula: 'bill * (1 + tipPct / 100)',
            resultLabel: 'Total',
            resultPrefix: '$',
          },
        },
      ])
    )
    expect(html).toContain('Tip Calculator')
    expect(html).toContain('calc-bill')
    expect(html).toContain('calc-tipPct')
    expect(html).toContain('bill * (1 + tipPct / 100)')
    expect(html).toContain('$')
  })

  it('renders a form primitive with fields', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'form',
          id: 'contact',
          position: 0,
          props: {
            title: 'Contact Us',
            fields: [
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'msg', label: 'Message', type: 'textarea' },
            ],
            submitLabel: 'Send',
            successMessage: 'Thanks!',
          },
        },
      ])
    )
    expect(html).toContain('Contact Us')
    expect(html).toContain('type="email"')
    expect(html).toContain('<textarea')
    expect(html).toContain('Send')
    expect(html).toContain('Thanks!')
  })

  it('renders a checklist primitive with progress', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'checklist',
          id: 'todo',
          position: 0,
          props: {
            title: 'My Checklist',
            categories: [{ name: 'Tasks', items: ['Item A', 'Item B'] }],
            showProgress: true,
          },
        },
      ])
    )
    expect(html).toContain('My Checklist')
    expect(html).toContain('Item A')
    expect(html).toContain('Item B')
    expect(html).toContain('progress-bar')
    expect(html).toContain('0 / 2')
  })

  it('renders a table primitive', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'table',
          id: 'data',
          position: 0,
          props: {
            title: 'Sales Data',
            columns: [
              { key: 'name', label: 'Name' },
              { key: 'amount', label: 'Amount', type: 'currency' },
            ],
            rows: [{ name: 'Widget', amount: 29.99 }],
            searchable: true,
          },
        },
      ])
    )
    expect(html).toContain('Sales Data')
    expect(html).toContain('Widget')
    expect(html).toContain('$29.99')
    expect(html).toContain('Search...')
  })

  it('renders a quiz primitive', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'quiz',
          id: 'trivia',
          position: 0,
          props: {
            title: 'Pop Quiz',
            questions: [
              { question: 'What is 2+2?', options: ['3', '4', '5'], correct: 1 },
            ],
            showScore: true,
          },
        },
      ])
    )
    expect(html).toContain('Pop Quiz')
    expect(html).toContain('What is 2+2?')
    expect(html).toContain('quiz-option')
  })

  it('renders a timer primitive', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'timer',
          id: 'pomodoro',
          position: 0,
          props: {
            title: 'Pomodoro',
            mode: 'countdown',
            durations: [
              { label: '25 min', seconds: 1500 },
              { label: '5 min', seconds: 300 },
            ],
          },
        },
      ])
    )
    expect(html).toContain('Pomodoro')
    expect(html).toContain('25:00')
    expect(html).toContain('timer-display')
  })

  it('renders a chart primitive (bar)', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'chart',
          id: 'sales-chart',
          position: 0,
          props: {
            title: 'Monthly Sales',
            chartType: 'bar',
            data: [
              { label: 'Jan', value: 100 },
              { label: 'Feb', value: 150 },
            ],
          },
        },
      ])
    )
    expect(html).toContain('Monthly Sales')
    expect(html).toContain('bar-chart')
    expect(html).toContain('Jan')
  })

  it('renders a chart primitive (pie)', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'chart',
          id: 'pie-chart',
          position: 0,
          props: {
            title: 'Market Share',
            chartType: 'pie',
            data: [
              { label: 'A', value: 60 },
              { label: 'B', value: 40 },
            ],
          },
        },
      ])
    )
    expect(html).toContain('Market Share')
    expect(html).toContain('conic-gradient')
  })

  it('renders a list primitive with add/remove', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'list',
          id: 'groceries',
          position: 0,
          props: {
            title: 'Groceries',
            items: ['Milk', 'Eggs'],
            addable: true,
            removable: true,
          },
        },
      ])
    )
    expect(html).toContain('Groceries')
    expect(html).toContain('Milk')
    expect(html).toContain('list_groceries_add')
  })

  it('renders a generator primitive', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'generator',
          id: 'bio',
          position: 0,
          props: {
            title: 'Bio Generator',
            inputLabel: 'Your name',
            inputPlaceholder: 'Enter name...',
            buttonLabel: 'Generate Bio',
            templates: ['{{input}} is awesome!'],
            outputLabel: 'Your Bio',
          },
        },
      ])
    )
    expect(html).toContain('Bio Generator')
    expect(html).toContain('Generate Bio')
    expect(html).toContain('gen-input-bio')
  })

  it('renders a template primitive', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'template',
          id: 'email',
          position: 0,
          props: {
            title: 'Email Template',
            fields: [{ name: 'name', label: 'Name', placeholder: 'Your name' }],
            template: 'Dear {{name}},',
            copyButton: true,
          },
        },
      ])
    )
    expect(html).toContain('Email Template')
    expect(html).toContain('Copy to Clipboard')
    expect(html).toContain('Dear {{name}}')
  })

  it('renders a tracker primitive', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'tracker',
          id: 'habits',
          position: 0,
          props: {
            title: 'Daily Habits',
            items: [{ name: 'Exercise', icon: '💪' }],
            period: 'daily',
            showStreak: true,
          },
        },
      ])
    )
    expect(html).toContain('Daily Habits')
    expect(html).toContain('daily tracker')
    expect(html).toContain('tracker-btn')
  })

  it('handles multiple primitives sorted by position', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'calculator',
          id: 'calc-second',
          position: 1,
          props: { title: 'Second', inputs: [], formula: '0', resultLabel: 'R' },
        },
        {
          type: 'form',
          id: 'form-first',
          position: 0,
          props: { title: 'First', fields: [], submitLabel: 'Go', successMessage: 'Done' },
        },
      ])
    )
    const firstIdx = html.indexOf('First')
    const secondIdx = html.indexOf('Second')
    expect(firstIdx).toBeLessThan(secondIdx)
  })

  it('handles unknown primitive types gracefully', () => {
    const html = assembleTool(
      makeConfig([
        { type: 'nonexistent', id: 'unknown', position: 0, props: {} },
      ])
    )
    expect(html).toContain('Unknown primitive: nonexistent')
  })

  it('renders a realtime-collab primitive with presence and toolbar', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'realtime-collab',
          id: 'collab-doc',
          position: 0,
          props: {
            title: 'Team Document',
            placeholder: 'Start writing...',
            collaborators: [
              { name: 'Alice', color: '#7c3aed' },
              { name: 'Bob', color: '#3b82f6' },
            ],
            showToolbar: true,
            initialContent: 'Hello team!',
          },
        },
      ])
    )
    expect(html).toContain('Team Document')
    expect(html).toContain('Alice')
    expect(html).toContain('Bob')
    expect(html).toContain('collab-editor')
    expect(html).toContain('collab-toolbar')
    expect(html).toContain('Hello team!')
    expect(html).toContain('collab-presence')
    expect(html).toContain('contenteditable="true"')
  })

  it('renders an ai-chat primitive with welcome message and responses', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'ai-chat',
          id: 'support-chat',
          position: 0,
          props: {
            title: 'Support Bot',
            botName: 'Helper',
            botAvatar: '🤖',
            placeholder: 'Ask me anything...',
            welcomeMessage: 'Hi! How can I help?',
            responses: [{ trigger: 'pricing', reply: 'Check our pricing page.' }],
            defaultReply: 'Let me look into that.',
          },
        },
      ])
    )
    expect(html).toContain('Helper')
    expect(html).toContain('🤖')
    expect(html).toContain('Hi! How can I help?')
    expect(html).toContain('chat-messages')
    expect(html).toContain('chat-input-row')
    expect(html).toContain('Ask me anything...')
    expect(html).toContain('pricing')
  })

  it('renders a payment-form primitive with summary and card fields', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'payment-form',
          id: 'checkout',
          position: 0,
          props: {
            title: 'Checkout',
            currency: '$',
            items: [
              { label: 'Pro Plan', amount: 29.99 },
              { label: 'Tax', amount: 2.40 },
            ],
            showSummary: true,
            successMessage: 'Payment received!',
          },
        },
      ])
    )
    expect(html).toContain('Checkout')
    expect(html).toContain('Pro Plan')
    expect(html).toContain('$29.99')
    expect(html).toContain('$32.39')
    expect(html).toContain('1234 5678 9012 3456')
    expect(html).toContain('MM / YY')
    expect(html).toContain('CVC')
    expect(html).toContain('payment-summary')
    expect(html).toContain('Payment received!')
    expect(html).toContain('256-bit encryption')
  })

  it('renders an analytics-dashboard primitive with KPIs and charts', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'analytics-dashboard',
          id: 'dash',
          position: 0,
          props: {
            title: 'Sales Analytics',
            kpis: [
              { label: 'Revenue', value: '$12,450', trend: 12.5, icon: '💰' },
              { label: 'Users', value: '3,241', trend: -2.1 },
            ],
            charts: [
              { title: 'Revenue Over Time', type: 'line', data: [{ label: 'Jan', value: 100 }, { label: 'Feb', value: 150 }] },
              { title: 'Traffic Sources', type: 'pie', data: [{ label: 'Direct', value: 40 }, { label: 'Search', value: 60 }] },
            ],
            timeRanges: ['7d', '30d', '90d'],
            defaultRange: '30d',
          },
        },
      ])
    )
    expect(html).toContain('Sales Analytics')
    expect(html).toContain('$12,450')
    expect(html).toContain('3,241')
    expect(html).toContain('analytics-kpi')
    expect(html).toContain('Revenue Over Time')
    expect(html).toContain('Traffic Sources')
    expect(html).toContain('analytics-tabs')
    expect(html).toContain('30d')
    expect(html).toContain('conic-gradient')
    expect(html).toContain('polyline')
  })

  it('renders a notification-center primitive with bell, list, and toast', () => {
    const html = assembleTool(
      makeConfig([
        {
          type: 'notification-center',
          id: 'notifs',
          position: 0,
          props: {
            title: 'Notifications',
            notifications: [
              { id: 'n1', title: 'New message', description: 'Alice sent you a message', time: '2m ago', icon: '💬', read: false },
              { id: 'n2', title: 'Deployment done', description: 'v2.1.0 deployed', time: '1h ago', icon: '🚀', read: true },
            ],
            showBell: true,
            showToast: true,
            toastDuration: 3000,
          },
        },
      ])
    )
    expect(html).toContain('Notifications')
    expect(html).toContain('notif-bell')
    expect(html).toContain('notif-panel')
    expect(html).toContain('New message')
    expect(html).toContain('Deployment done')
    expect(html).toContain('Mark all read')
    expect(html).toContain('notif-badge')
    expect(html).toContain('notif-toast')
  })
})
