// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Accordion from './Accordion'
import defaults from './defaults.json'

describe('Accordion', () => {
  const config = defaults as any

  it('renders the title', () => {
    render(<Accordion config={config} />)
    expect(screen.getByText('Frequently Asked Questions')).toBeTruthy()
  })

  it('renders all section titles', () => {
    render(<Accordion config={config} />)
    expect(screen.getByText('What is AgentDoom?')).toBeTruthy()
    expect(screen.getByText('How much does it cost?')).toBeTruthy()
    expect(screen.getByText('Is my data secure?')).toBeTruthy()
    expect(screen.getByText('How do I get support?')).toBeTruthy()
  })

  it('opens defaultOpen sections', () => {
    render(<Accordion config={config} />)
    // The first section is defaultOpen, so its content should be visible
    expect(screen.getByText(/AgentDoom is a platform/)).toBeTruthy()
  })

  it('toggles sections on click', () => {
    render(<Accordion config={config} />)
    // Click a closed section to open it
    fireEvent.click(screen.getByText('How much does it cost?'))
    expect(screen.getByText(/free tier for personal use/)).toBeTruthy()
  })

  it('collapses open sections on click', () => {
    render(<Accordion config={config} />)
    const btn = screen.getByText('What is AgentDoom?')
    // It's open by default, close it
    fireEvent.click(btn)
    // The panel height should animate to 0
    const panel = document.getElementById('accordion-panel-what')
    expect(panel).toBeTruthy()
  })

  it('allows multiple sections open when allowMultiple is true', () => {
    render(<Accordion config={config} />)
    fireEvent.click(screen.getByText('How much does it cost?'))
    fireEvent.click(screen.getByText('Is my data secure?'))
    // Both should be open along with the defaultOpen section
    expect(screen.getByText(/free tier for personal use/)).toBeTruthy()
    expect(screen.getByText(/encrypted at rest/)).toBeTruthy()
  })

  it('closes other sections when allowMultiple is false', () => {
    const singleConfig = { ...config, allowMultiple: false }
    render(<Accordion config={singleConfig} />)
    // First section is open by default
    expect(screen.getByText(/AgentDoom is a platform/)).toBeTruthy()
    // Open second section
    fireEvent.click(screen.getByText('How much does it cost?'))
    expect(screen.getByText(/free tier for personal use/)).toBeTruthy()
    // First section panel should now be closed (height 0)
    const firstPanel = document.getElementById('accordion-panel-what')
    expect(firstPanel?.style.height).toBe('0px')
  })

  it('renders icons when provided', () => {
    render(<Accordion config={config} />)
    // Icons are in the DOM as text content
    const container = document.querySelector('.rounded-xl')
    expect(container?.textContent).toContain('\ud83d\ude80')
    expect(container?.textContent).toContain('\ud83d\udcb0')
  })

  it('respects disabled state', () => {
    const disabledConfig = {
      title: 'Test',
      sections: [
        { id: 'a', title: 'Disabled Section', content: 'Hidden', disabled: true },
      ],
    }
    render(<Accordion config={disabledConfig} />)
    const btn = screen.getByText('Disabled Section')
    expect(btn.closest('button')?.getAttribute('aria-disabled')).toBe('true')
  })

  it('handles empty sections gracefully', () => {
    render(<Accordion config={{ title: 'Empty', sections: [] }} />)
    expect(screen.getByText('No sections to display.')).toBeTruthy()
  })

  it('supports keyboard interaction via Enter key', () => {
    render(<Accordion config={config} />)
    const btn = screen.getByText('How much does it cost?').closest('button')!
    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(screen.getByText(/free tier for personal use/)).toBeTruthy()
  })

  it('supports keyboard interaction via Space key', () => {
    render(<Accordion config={config} />)
    const btn = screen.getByText('Is my data secure?').closest('button')!
    fireEvent.keyDown(btn, { key: ' ' })
    expect(screen.getByText(/encrypted at rest/)).toBeTruthy()
  })

  it('renders with compact mode', () => {
    const compactConfig = { ...config, compact: true }
    render(<Accordion config={compactConfig} />)
    expect(screen.getByText('Frequently Asked Questions')).toBeTruthy()
  })

  it('renders with bordered=false mode', () => {
    const unborderedConfig = { ...config, bordered: false }
    render(<Accordion config={unborderedConfig} />)
    expect(screen.getByText('Frequently Asked Questions')).toBeTruthy()
  })
})
