'use client'

import React, { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface SettingsField {
  name: string
  label: string
  type: 'text' | 'email' | 'select' | 'toggle' | 'textarea' | 'number'
  value?: string | number | boolean
  placeholder?: string
  options?: string[]
  description?: string
}

export interface SettingsSection {
  title: string
  description?: string
  fields: SettingsField[]
}

export interface SettingsTab {
  id: string
  label: string
  icon?: string
  sections: SettingsSection[]
}

export interface SettingsPanelConfig {
  title: string
  tabs: SettingsTab[]
  saveLabel?: string
  successMessage?: string
  appearance?: AppearanceConfig
}

export default function SettingsPanel({ config }: { config: SettingsPanelConfig }) {
  const { title, tabs, saveLabel = 'Save Changes', successMessage = 'Settings saved successfully!' } = config
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')
  const [formState, setFormState] = useState<Record<string, string | number | boolean>>(() => {
    const initial: Record<string, string | number | boolean> = {}
    for (const tab of tabs) {
      for (const section of tab.sections) {
        for (const field of section.fields) {
          if (field.value !== undefined) {
            initial[field.name] = field.value
          } else if (field.type === 'toggle') {
            initial[field.name] = false
          } else if (field.type === 'number') {
            initial[field.name] = 0
          } else {
            initial[field.name] = ''
          }
        }
      }
    }
    return initial
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  const handleFieldChange = useCallback((name: string, value: string | number | boolean) => {
    setFormState(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSave = useCallback(() => {
    setShowSuccess(true)
  }, [])

  const handleTabKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    const tabIds = tabs.map(t => t.id)
    const currentIndex = tabIds.indexOf(activeTab)
    let nextIndex = -1

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % tabIds.length
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length
    }

    if (nextIndex >= 0) {
      setActiveTab(tabIds[nextIndex])
      const buttons = tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      buttons?.[nextIndex]?.focus()
    }
  }, [activeTab, tabs])

  const currentTab = tabs.find(t => t.id === activeTab)

  const renderField = (field: SettingsField) => {
    const value = formState[field.name]

    if (field.type === 'toggle') {
      const isOn = Boolean(value)
      return (
        <div key={field.name} className="flex items-center justify-between py-3">
          <div>
            <label htmlFor={field.name} className="text-sm font-medium text-gray-900">
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
            )}
          </div>
          <button
            id={field.name}
            role="switch"
            aria-checked={isOn}
            onClick={() => handleFieldChange(field.name, !isOn)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isOn ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                isOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} className="mb-4">
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-900 mb-1">
            {field.label}
          </label>
          {field.description && (
            <p className="text-xs text-gray-500 mb-1">{field.description}</p>
          )}
          <select
            id={field.name}
            value={String(value ?? '')}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none"
          >
            <option value="">{field.placeholder ?? 'Select...'}</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className="mb-4">
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-900 mb-1">
            {field.label}
          </label>
          {field.description && (
            <p className="text-xs text-gray-500 mb-1">{field.description}</p>
          )}
          <textarea
            id={field.name}
            value={String(value ?? '')}
            placeholder={field.placeholder}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none resize-none"
          />
        </div>
      )
    }

    return (
      <div key={field.name} className="mb-4">
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-900 mb-1">
          {field.label}
        </label>
        {field.description && (
          <p className="text-xs text-gray-500 mb-1">{field.description}</p>
        )}
        <input
          id={field.name}
          type={field.type}
          value={field.type === 'number' ? Number(value ?? 0) : String(value ?? '')}
          placeholder={field.placeholder}
          onChange={e =>
            handleFieldChange(
              field.name,
              field.type === 'number' ? Number(e.target.value) : e.target.value
            )
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none"
        />
      </div>
    )
  }

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>

      {/* Success toast */}
      {showSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      {/* Tab bar */}
      {tabs.length > 0 && (
        <div ref={tabsRef} role="tablist" className="flex border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={handleTabKeyDown}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {currentTab && (
        <div role="tabpanel" id={`panel-${currentTab.id}`}>
          {currentTab.sections.map((section, idx) => (
            <div key={section.title}>
              {idx > 0 && <hr className="my-6 border-gray-100" />}
              <div className="mb-4">
                <h3 className="text-base font-medium text-gray-900">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
                )}
              </div>
              <div>{section.fields.map(renderField)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          {saveLabel}
        </button>
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
