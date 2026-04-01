'use client'

import React, { useState, useCallback, useMemo } from 'react'

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation?: string
}

export interface QuizConfig {
  title: string
  questions: QuizQuestion[]
  showScore?: boolean
  shuffleQuestions?: boolean
}

export default function Quiz({ config }: { config: QuizConfig }) {
  const questions = useMemo(() => {
    if (config.shuffleQuestions) {
      return [...config.questions].sort(() => Math.random() - 0.5)
    }
    return config.questions
  }, [config.questions, config.shuffleQuestions])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = questions[currentIdx]

  const handleSelect = useCallback((optIdx: number) => {
    if (answered) return
    setSelected(optIdx)
  }, [answered])

  const handleSubmit = useCallback(() => {
    if (selected === null) return
    setAnswered(true)
    if (selected === current.correct) {
      setScore(prev => prev + 1)
    }
  }, [selected, current?.correct])

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrentIdx(prev => prev + 1)
      setSelected(null)
      setAnswered(false)
    }
  }, [currentIdx, questions.length])

  const handleRestart = useCallback(() => {
    setCurrentIdx(0)
    setSelected(null)
    setAnswered(false)
    setScore(0)
    setFinished(false)
  }, [])

  if (finished) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">{config.title}</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-3" aria-hidden="true">🎉</div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{score}/{questions.length}</p>
          <p className="text-sm text-gray-500 mb-6">
            {score === questions.length ? 'Perfect score!' : score >= questions.length / 2 ? 'Good job!' : 'Keep practicing!'}
          </p>
          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
        {config.showScore !== false && (
          <span className="text-xs text-gray-400">{currentIdx + 1}/{questions.length}</span>
        )}
      </div>

      {/* Progress */}
      <div className="bg-gray-200 rounded-full h-1.5 mb-4 overflow-hidden">
        <div
          className="h-full bg-purple-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <p className="text-sm font-medium text-gray-800 mb-4">{current.question}</p>

      <div className="space-y-2 mb-4" role="radiogroup" aria-label="Answer options">
        {current.options.map((opt, i) => {
          let cls = 'border-gray-200 bg-gray-50 hover:bg-gray-100'
          if (answered) {
            if (i === current.correct) cls = 'border-green-500 bg-green-50'
            else if (i === selected) cls = 'border-red-500 bg-red-50'
          } else if (i === selected) {
            cls = 'border-purple-500 bg-purple-50'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              role="radio"
              aria-checked={selected === i}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-colors ${cls}`}
            >
              <span className="font-medium mr-2 text-gray-400">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {answered && current.explanation && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
          💡 {current.explanation}
        </p>
      )}

      {!answered ? (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answer
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}
        </button>
      )}
    </div>
  )
}
