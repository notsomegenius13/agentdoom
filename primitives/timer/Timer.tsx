'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'

export interface TimerDuration {
  label: string
  seconds: number
}

export interface TimerConfig {
  title: string
  mode: 'countdown' | 'pomodoro' | 'stopwatch'
  durations?: TimerDuration[]
  alertSound?: boolean
}

export default function Timer({ config }: { config: TimerConfig }) {
  const defaultDuration = config.durations?.[0]?.seconds ?? 300
  const [timeLeft, setTimeLeft] = useState(config.mode === 'stopwatch' ? 0 : defaultDuration)
  const [totalTime, setTotalTime] = useState(defaultDuration)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatTime = (secs: number) => {
    const m = Math.floor(Math.abs(secs) / 60)
    const s = Math.abs(secs) % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)
  }, [])

  const start = useCallback(() => {
    if (finished) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (config.mode === 'stopwatch') return prev + 1
        if (prev <= 1) {
          stop()
          setFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [config.mode, finished, stop])

  const reset = useCallback(() => {
    stop()
    setTimeLeft(config.mode === 'stopwatch' ? 0 : totalTime)
    setFinished(false)
  }, [config.mode, totalTime, stop])

  const selectDuration = useCallback((secs: number) => {
    stop()
    setTotalTime(secs)
    setTimeLeft(secs)
    setFinished(false)
  }, [stop])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const progress = config.mode === 'stopwatch'
    ? 0
    : totalTime > 0
      ? ((totalTime - timeLeft) / totalTime) * 100
      : 0

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-1 text-gray-900">{config.title}</h2>
      <p className="text-xs text-gray-400 mb-4 capitalize">{config.mode}</p>

      {/* Duration presets */}
      {config.durations?.length && config.mode !== 'stopwatch' ? (
        <div className="flex gap-2 mb-4 flex-wrap">
          {config.durations.map(d => (
            <button
              key={d.seconds}
              onClick={() => selectDuration(d.seconds)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                totalTime === d.seconds
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Timer display */}
      <div className="text-center mb-4">
        {config.mode !== 'stopwatch' && (
          <div className="mb-2">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        <div
          className={`text-5xl font-mono font-bold tabular-nums ${finished ? 'text-green-600' : 'text-gray-900'}`}
          role="timer"
          aria-live="polite"
        >
          {formatTime(timeLeft)}
        </div>
        {finished && <p className="text-sm text-green-600 font-medium mt-2">Time's up!</p>}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={start}
            disabled={finished && config.mode !== 'stopwatch'}
            className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {timeLeft === (config.mode === 'stopwatch' ? 0 : totalTime) ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex-1 px-4 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            Pause
          </button>
        )}
        <button
          onClick={reset}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
