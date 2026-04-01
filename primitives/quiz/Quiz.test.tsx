// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Quiz from './Quiz'
import defaults from './defaults.json'

describe('Quiz', () => {
  const config = defaults as any

  it('renders title and first question', () => {
    render(<Quiz config={config} />)
    expect(screen.getByText('General Knowledge Quiz')).toBeTruthy()
    expect(screen.getByText('What planet is known as the Red Planet?')).toBeTruthy()
  })

  it('shows question counter', () => {
    render(<Quiz config={config} />)
    expect(screen.getByText('1/2')).toBeTruthy()
  })

  it('highlights selected answer', () => {
    render(<Quiz config={config} />)
    fireEvent.click(screen.getByText('Mars'))
    fireEvent.click(screen.getByText('Check Answer'))
    // After checking, explanation should appear
    expect(screen.getByText(/Mars appears red/)).toBeTruthy()
  })

  it('shows wrong answer feedback', () => {
    render(<Quiz config={config} />)
    fireEvent.click(screen.getByText('Venus'))
    fireEvent.click(screen.getByText('Check Answer'))
    expect(screen.getByText(/Mars appears red/)).toBeTruthy()
  })

  it('progresses to next question', () => {
    render(<Quiz config={config} />)
    fireEvent.click(screen.getByText('Mars'))
    fireEvent.click(screen.getByText('Check Answer'))
    fireEvent.click(screen.getByText('Next Question'))
    expect(screen.getByText('What is the largest ocean on Earth?')).toBeTruthy()
  })

  it('shows final score', () => {
    render(<Quiz config={config} />)
    // Q1: correct
    fireEvent.click(screen.getByText('Mars'))
    fireEvent.click(screen.getByText('Check Answer'))
    fireEvent.click(screen.getByText('Next Question'))
    // Q2: correct
    fireEvent.click(screen.getByText('Pacific'))
    fireEvent.click(screen.getByText('Check Answer'))
    fireEvent.click(screen.getByText('See Results'))
    expect(screen.getByText('2/2')).toBeTruthy()
    expect(screen.getByText('Perfect score!')).toBeTruthy()
  })
})
