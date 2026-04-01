'use client'

export interface MediaPlayerConfig {
  title: string
  type: 'audio' | 'video'
  src: string
  poster?: string
  autoplay?: boolean
  loop?: boolean
  showControls?: boolean
}

export default function MediaPlayer({ config }: { config: MediaPlayerConfig }) {
  const {
    title,
    type,
    src,
    poster,
    autoplay = false,
    loop = false,
    showControls = true,
  } = config

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{title}</h2>
      <div className="rounded-lg overflow-hidden bg-black">
        {type === 'video' ? (
          <video
            src={src}
            poster={poster}
            autoPlay={autoplay}
            loop={loop}
            controls={showControls}
            aria-label={title}
            className="w-full block"
          >
            Your browser does not support the video element.
          </video>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <audio
              src={src}
              autoPlay={autoplay}
              loop={loop}
              controls={showControls}
              aria-label={title}
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  )
}
