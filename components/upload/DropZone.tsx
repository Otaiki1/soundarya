'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { getOrCreateSessionId } from '@/lib/session'
import type { AnalysisPublic, LoadingStage } from '@/types/analysis'

type DropZoneState = 'idle' | 'uploading' | 'analysing' | 'error'

interface DropZoneProps {
  onResult?: (data: AnalysisPublic) => void
  onAnalysisComplete?: (data: AnalysisPublic) => void
}

export function DropZone({ onResult, onAnalysisComplete }: DropZoneProps) {
  const [state, setState] = useState<DropZoneState>('idle')
  const [progress, setProgress] = useState<LoadingStage>('detecting')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const handleResult = onResult ?? onAnalysisComplete

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
      if (handleResult) {
        handleResult(data)
      }
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      clearInterval(interval)
    }
  }, [handleResult])

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
        relative border border-dashed p-8 sm:p-10 text-center cursor-pointer transition-all bg-gold/5 rounded-sm
        ${isDragActive
          ? 'border-gold bg-gold/10 scale-[1.01]'
          : 'border-border/30 hover:border-gold hover:bg-gold/10'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-5">
        <div className="mx-auto w-14 h-14 border border-border rounded-full flex items-center justify-center text-gold transition-all">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-light text-text mb-2 tracking-wide">
            {isDragActive ? 'Drop your photo here' : 'Drop your photo here'}
          </h3>
          <p className="text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
            or click to browse · JPEG, PNG, WEBP · Max 10MB
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary inline-block"
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
    { key: 'ratio', label: 'Measuring proportionality', icon: '📐' },
    { key: 'structure', label: 'Evaluating bone structure', icon: '🦴' },
    { key: 'writing', label: 'Writing your analysis', icon: '✍️' }
  ]

  const currentIndex = stages.findIndex(stage => stage.key === currentStage)

  return (
    <div className="flex flex-col items-center space-y-6 p-8 sm:p-10 bg-card border border-border rounded-sm">
      <div className="w-16 h-16 border border-border border-t-gold rounded-full animate-spin"></div>
      <div className="text-center">
        <h3 className="font-serif text-xl font-light text-gold mb-3 tracking-wide">
          {stages[currentIndex]?.label || 'Processing...'}
        </h3>
        <div className="flex space-x-3 justify-center">
          {stages.map((stage, index) => (
            <div
              key={stage.key}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                index <= currentIndex ? 'bg-gold scale-125' : 'bg-border/30'
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
    <div className="text-center p-8 sm:p-10 space-y-6 bg-card border border-border rounded-sm">
      <div className="w-16 h-16 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 text-3xl">⚠️</div>
      <div>
        <h3 className="font-serif text-2xl font-light text-text mb-2 tracking-wide">Analysis Failed</h3>
        <p className="text-[11px] tracking-[0.05em] text-muted max-w-xs mx-auto">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="btn-secondary inline-block"
      >
        Try Again
      </button>
    </div>
  )
}
