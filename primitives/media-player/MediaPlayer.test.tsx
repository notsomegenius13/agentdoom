import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MediaPlayer, { MediaPlayerConfig } from './MediaPlayer'

describe('MediaPlayer', () => {
  const videoConfig: MediaPlayerConfig = {
    title: 'Demo Video',
    type: 'video',
    src: 'https://example.com/video.mp4',
    poster: 'https://example.com/poster.jpg',
    showControls: true,
  }

  const audioConfig: MediaPlayerConfig = {
    title: 'Demo Audio',
    type: 'audio',
    src: 'https://example.com/audio.mp3',
    showControls: true,
  }

  it('renders the title', () => {
    render(<MediaPlayer config={videoConfig} />)
    expect(screen.getByText('Demo Video')).toBeDefined()
  })

  it('renders a video element for video type', () => {
    render(<MediaPlayer config={videoConfig} />)
    const video = screen.getByLabelText('Demo Video') as HTMLVideoElement
    expect(video.tagName).toBe('VIDEO')
    expect(video.src).toContain('video.mp4')
  })

  it('renders an audio element for audio type', () => {
    render(<MediaPlayer config={audioConfig} />)
    const audio = screen.getByLabelText('Demo Audio') as HTMLAudioElement
    expect(audio.tagName).toBe('AUDIO')
    expect(audio.src).toContain('audio.mp3')
  })

  it('shows controls when showControls is true', () => {
    render(<MediaPlayer config={videoConfig} />)
    const video = screen.getByLabelText('Demo Video') as HTMLVideoElement
    expect(video.controls).toBe(true)
  })

  it('hides controls when showControls is false', () => {
    const config: MediaPlayerConfig = { ...videoConfig, showControls: false }
    render(<MediaPlayer config={config} />)
    const video = screen.getByLabelText('Demo Video') as HTMLVideoElement
    expect(video.controls).toBe(false)
  })

  it('sets poster on video element', () => {
    render(<MediaPlayer config={videoConfig} />)
    const video = screen.getByLabelText('Demo Video') as HTMLVideoElement
    expect(video.poster).toContain('poster.jpg')
  })
})
