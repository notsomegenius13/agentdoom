'use client'

import React, { useState, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface LandingFeature {
  icon: string
  title: string
  description: string
}

export interface LandingHeroConfig {
  title: string
  highlightText?: string
  subtitle: string
  ctaLabel: string
  ctaSecondaryLabel?: string
  emailCapture?: boolean
  emailPlaceholder?: string
  successMessage?: string
  features?: LandingFeature[]
  backgroundGradient?: string
  trustedBy?: string[]
  appearance?: AppearanceConfig
}

export default function LandingHero(config: LandingHeroConfig) {
  const {
    title,
    highlightText,
    subtitle,
    ctaLabel,
    ctaSecondaryLabel,
    emailCapture = false,
    emailPlaceholder = 'Enter your email',
    successMessage = 'Thanks! We\'ll be in touch.',
    features = [],
    backgroundGradient = 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3730a3 100%)',
    trustedBy = [],
  } = config

  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (email.trim()) {
        setSubmitted(true)
      }
    },
    [email]
  )

  const renderTitle = () => {
    if (!highlightText) {
      return <span>{title}</span>
    }
    const idx = title.indexOf(highlightText)
    if (idx === -1) {
      return <span>{title}</span>
    }
    const before = title.slice(0, idx)
    const after = title.slice(idx + highlightText.length)
    return (
      <>
        {before}
        <span className="text-purple-300">{highlightText}</span>
        {after}
      </>
    )
  }

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hero-animate {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .hero-animate-delay-1 {
          animation: fadeInUp 0.8s ease-out 0.15s forwards;
          opacity: 0;
        }
        .hero-animate-delay-2 {
          animation: fadeInUp 0.8s ease-out 0.3s forwards;
          opacity: 0;
        }
        .hero-animate-delay-3 {
          animation: fadeInUp 0.8s ease-out 0.45s forwards;
          opacity: 0;
        }
      `}</style>

      <section className="w-full">
        {/* Hero area */}
        <div
          className="w-full px-4 py-24 sm:py-32 flex flex-col items-center text-center"
          style={{ background: backgroundGradient }}
        >
          <h1 className="hero-animate text-4xl sm:text-5xl md:text-6xl font-extrabold text-white max-w-4xl leading-tight">
            {renderTitle()}
          </h1>

          <p className="hero-animate-delay-1 mt-6 text-lg sm:text-xl text-purple-100 max-w-2xl">
            {subtitle}
          </p>

          <div className="hero-animate-delay-2 mt-10 flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg">
            {emailCapture ? (
              submitted ? (
                <p className="text-green-300 font-medium text-lg" data-testid="success-message">
                  {successMessage}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={emailPlaceholder}
                    className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors whitespace-nowrap"
                  >
                    {ctaLabel}
                  </button>
                </form>
              )
            ) : (
              <>
                <button className="px-8 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors">
                  {ctaLabel}
                </button>
                {ctaSecondaryLabel && (
                  <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                    {ctaSecondaryLabel}
                  </button>
                )}
              </>
            )}
          </div>

          {ctaSecondaryLabel && emailCapture && !submitted && (
            <div className="hero-animate-delay-2 mt-4">
              <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                {ctaSecondaryLabel}
              </button>
            </div>
          )}

          {trustedBy.length > 0 && (
            <div className="hero-animate-delay-3 mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-purple-200 text-sm">
              {trustedBy.map((item, i) => (
                <span key={i} className="font-medium">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Features section */}
        {features.length > 0 && (
          <div className="w-full bg-white px-4 py-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
              {features.map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6">
                  <span className="text-4xl mb-4" role="img" aria-label={feature.title}>
                    {feature.icon}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
    </PrimitiveWrapper>
  )
}
