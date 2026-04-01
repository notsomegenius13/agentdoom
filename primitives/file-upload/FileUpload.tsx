'use client'

import React, { useState, useRef, useCallback } from 'react'

export interface FileUploadConfig {
  title: string
  acceptedTypes?: string[]
  maxFileSizeMB?: number
  maxFiles?: number
  uploadLabel?: string
  dragDropLabel?: string
}

interface SelectedFile {
  name: string
  size: number
  type: string
}

export default function FileUpload({ config }: { config: FileUploadConfig }) {
  const [files, setFiles] = useState<SelectedFile[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxFiles = config.maxFiles ?? 10
  const maxSizeMB = config.maxFileSizeMB ?? 10
  const acceptedTypes = config.acceptedTypes ?? []
  const uploadLabel = config.uploadLabel ?? 'Click to browse'
  const dragDropLabel = config.dragDropLabel ?? 'Drag and drop files here'

  const validateAndAdd = useCallback((incoming: File[]) => {
    const newErrors: string[] = []
    const valid: SelectedFile[] = []

    for (const file of incoming) {
      if (acceptedTypes.length > 0) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!acceptedTypes.some(t => t.toLowerCase() === ext || file.type.includes(t.replace('.', '')))) {
          newErrors.push(`"${file.name}" has an unsupported file type.`)
          continue
        }
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        newErrors.push(`"${file.name}" exceeds the ${maxSizeMB}MB size limit.`)
        continue
      }
      valid.push({ name: file.name, size: file.size, type: file.type })
    }

    setFiles(prev => {
      const combined = [...prev, ...valid]
      if (combined.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed.`)
        return combined.slice(0, maxFiles)
      }
      return combined
    })

    setErrors(newErrors)
  }, [acceptedTypes, maxSizeMB, maxFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    validateAndAdd(dropped)
  }, [validateAndAdd])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAdd(Array.from(e.target.files))
      e.target.value = ''
    }
  }, [validateAndAdd])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setErrors([])
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const acceptAttr = acceptedTypes.length > 0 ? acceptedTypes.join(',') : undefined

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{config.title}</h2>

      <div
        role="button"
        tabIndex={0}
        aria-label={uploadLabel}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <div className="text-3xl text-gray-400 mb-2" aria-hidden="true">{'\u2191'}</div>
        <p className="text-sm text-gray-600 mb-1">{dragDropLabel}</p>
        <p className="text-sm text-blue-600 font-medium">{uploadLabel}</p>
        {acceptedTypes.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Accepted: {acceptedTypes.join(', ')} &middot; Max {maxSizeMB}MB
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptAttr}
          onChange={handleFileInput}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-600" role="alert">{err}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2" role="list">
          {files.map((file, i) => (
            <li key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="ml-3 text-gray-400 hover:text-red-500 transition-colors text-sm font-bold"
                aria-label={`Remove ${file.name}`}
              >
                {'\u00D7'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {files.length}/{maxFiles} files selected
        </p>
      )}
    </div>
  )
}
