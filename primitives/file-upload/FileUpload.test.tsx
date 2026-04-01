// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileUpload from './FileUpload'
import defaults from './defaults.json'

describe('FileUpload', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<FileUpload config={config} />)
    expect(screen.getByText('Upload Images')).toBeTruthy()
  })

  it('shows upload zone', () => {
    render(<FileUpload config={config} />)
    expect(screen.getByLabelText('Click to browse')).toBeTruthy()
  })

  it('shows drag drop label', () => {
    render(<FileUpload config={config} />)
    expect(screen.getByText('Drag and drop images here')).toBeTruthy()
  })

  it('validates file types', () => {
    render(<FileUpload config={config} />)
    const dropZone = screen.getByLabelText('Click to browse')

    const badFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const dataTransfer = { files: [badFile] }

    fireEvent.drop(dropZone, { dataTransfer })
    expect(screen.getByText('"test.pdf" has an unsupported file type.')).toBeTruthy()
  })
})
