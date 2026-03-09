'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { getOrCreateSessionId } from '@/lib/session'
import type { AnalysisPublic, LoadingStage } from '@/types/analysis'

type DropZoneState = 'idle' | 'uploading' | 'analysing' | 'error'

interface DropZoneProps {
  onResult: (data: AnalysisPublic) => void
}

export function DropZone({ onResult }: DropZoneProps) {
  const [state, setState] = useState<DropZoneState>('idle')
  const [progress, setProgress] = useState<LoadingStage>('detecting')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Reset state
    setState('analysing')
    setErrorMessage('')

    const formData = new FormData()
    formData.append('photo', file)
    formData.append('sessionId', getOrCreateSessionId())

    // Animate loading stages
    const stages: LoadingStage[] = ['detecting', 'symmetry', 'ratio', 'structure', 'writing']
    let stageIndex = 0
    const interval = setInterval(() => {
      if (stageIndex < stages.length) {
        setProgress(stages[stageIndex++])
      } else {
        clearInterval(interval)
      }
    }, 800)

    try {
      const res = await fetch('/api/analyse', { method: 'POST', body: formData })

      if (res.status === 429) {
        const data = await res.json()
        setState('error')
        setErrorMessage(`Rate limit exceeded. Try again in ${Math.ceil((data.retryAfter || 86400) / 3600)} hours.`)
        return
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data: AnalysisPublic = await res.json()
      onResult(data)
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      clearInterval(interval)
    }
  }, [onResult])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: state === 'analysing'
  })

  if (state === 'analysing') {
    return <LoadingStages currentStage={progress} />
  }

  if (state === 'error') {
    return <ErrorState message={errorMessage} onRetry={() => setState('idle')} />
  }

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop your photo here' : 'Upload your photo'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop or click to select a photo (JPEG, PNG, WebP, max 10MB)
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Choose File
        </button>
      </div>
    </div>
  )
}

function LoadingStages({ currentStage }: { currentStage: LoadingStage }) {
  const stages: { key: LoadingStage; label: string; icon: string }[] = [
    { key: 'detecting', label: 'Detecting facial features', icon: '🔍' },
    { key: 'symmetry', label: 'Analyzing symmetry', icon: '⚖️' },
    { key: 'ratio', label: 'Measuring golden ratio', icon: '📐' },
    { key: 'structure', label: 'Evaluating bone structure', icon: '🦴' },
    { key: 'writing', label: 'Writing your analysis', icon: '✍️' }
  ]

  const currentIndex = stages.findIndex(stage => stage.key === currentStage)

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      <div className="text-6xl animate-pulse">
        {stages[currentIndex]?.icon || '⏳'}
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {stages[currentIndex]?.label || 'Processing...'}
        </h3>
        <div className="flex space-x-2 justify-center">
          {stages.map((stage, index) => (
            <div
              key={stage.key}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center p-8 space-y-4">
      <div className="text-red-500 text-6xl">⚠️</div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Failed</h3>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Try Again
      </button>
    </div>
  )
}