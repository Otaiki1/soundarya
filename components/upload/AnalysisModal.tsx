'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AnalysisPublic } from '@/types/analysis'
import { useMintScore } from '@/hooks/useMintScore'
import { useSubscribe } from '@/hooks/useSubscribe'

type ModalState = 'LOADING' | 'RESULT_FREE' | 'RESULT_LOCKED'

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  imageFile: File | null
  analysisResult: AnalysisPublic | null
}

const STAGES = [
  'Detecting facial landmarks',
  'Measuring bilateral symmetry',
  'Calculating golden ratio',
  'Scoring bone structure',
  'Writing your analysis'
]

export function AnalysisModal({ isOpen, onClose, imageFile, analysisResult }: AnalysisModalProps) {
  const [visibleStageIndex, setVisibleStageIndex] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  
  const { isSubscribed } = useSubscribe()
  const { mint, isLoading: isMinting, isSuccess: isMintSuccess, error: mintError } = useMintScore()

  useEffect(() => {
    if (!isOpen || analysisResult) return
    setVisibleStageIndex(0)

    const interval = setInterval(() => {
      setVisibleStageIndex((prev) => {
        if (prev >= STAGES.length - 1) {
          return prev
        }
        return prev + 1
      })
    }, 900)

    return () => clearInterval(interval)
  }, [isOpen, analysisResult])

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  const modalState: ModalState = useMemo(() => {
    if (!analysisResult) return 'LOADING'
    if (isSubscribed || isMintSuccess || analysisResult.premiumUnlocked) return 'RESULT_FREE'
    return 'RESULT_LOCKED'
  }, [analysisResult, isSubscribed, isMintSuccess])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-[rgba(13,10,7,0.96)] backdrop-blur-lg p-4 sm:p-6">
      <div className="relative w-[90%] max-w-[900px] max-h-[85vh] overflow-y-auto bg-card border border-gold/20 animate-[modalIn_400ms_ease-out_forwards]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 border border-gold/35 text-gold hover:bg-gold hover:text-deep transition-colors z-10"
          aria-label="Close modal"
        >
          ✕
        </button>

        {modalState === 'LOADING' && (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border border-gold/30 border-t-gold animate-spin mb-6" />
            <h2 className="font-serif text-4xl text-gold-light mb-2">Analysing your face</h2>
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted mb-10">Soundarya Oracle · 7 dimensions</p>

            <div className="w-full max-w-lg space-y-4 text-left">
              {STAGES.map((stage, index) => {
                const isCompleted = index < visibleStageIndex
                const isCurrent = index === visibleStageIndex
                const isUpcoming = index > visibleStageIndex

                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-3 transition-all duration-300 ${isUpcoming ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
                  >
                    <span className={`w-5 text-center ${isCompleted ? 'text-muted' : isCurrent ? 'text-gold' : 'text-transparent'}`}>
                      {isCompleted ? '✓' : '•'}
                    </span>
                    <span className={`text-sm ${isCompleted ? 'text-muted' : isCurrent ? 'text-gold' : 'text-transparent'}`}>
                      {stage}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {analysisResult && (
          <>
            <div className="p-6 sm:p-8 border-b border-gold/20">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-3">Your Soundarya Report</p>
              <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] text-gold-light leading-tight">
                Overall Score: {analysisResult.overallScore.toFixed(1)}/10 · Top {analysisResult.percentile}%
              </h2>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid lg:grid-cols-[220px_1fr] gap-6 lg:gap-8">
                <div className="w-[200px] h-[200px] border border-gold/30 overflow-hidden bg-surface">
                  {previewUrl && (
                    <img src={previewUrl} alt="Uploaded face preview" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                  {[
                    { label: 'Symmetry', score: analysisResult.symmetryScore, max: 100 },
                    { label: 'Proportion', score: analysisResult.goldenRatioScore, max: 100 },
                    { label: 'Harmony', score: analysisResult.harmonyScore, max: 100 },
                    { label: 'Structure', score: analysisResult.boneStructureScore, max: 100 }
                  ].map((metric) => {
                    const progress = Math.max(0, Math.min(100, (metric.score / metric.max) * 100))
                    return (
                      <div key={metric.label} className="group">
                        <div className="flex justify-between items-end mb-4">
                          <span className="text-[9px] uppercase tracking-[0.3em] text-soft/60 group-hover:text-gold-bright transition-colors">
                            {metric.label}
                          </span>
                          <span className="font-serif text-xl group-hover:text-gold-bright transition-colors">
                            {metric.score.toFixed(0)}
                          </span>
                        </div>
                        <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gold-bright transition-all duration-1000 ease-expo"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-8 space-y-6">
                {analysisResult.persistenceError ? (
                  <div className="border border-amber-400/30 bg-amber-500/8 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-amber-300 mb-2">
                      Temporary Result
                    </p>
                    <p className="text-sm text-amber-100/80 leading-relaxed">
                      {analysisResult.persistenceError}
                    </p>
                  </div>
                ) : null}

                <div>
                  <h3 className="font-serif text-3xl text-gold-light mb-2">Analysis</h3>
                  <p className="text-sm text-muted leading-relaxed">{analysisResult.summary}</p>
                </div>

                <div>
                  <h3 className="font-serif text-3xl text-gold-light mb-2">Your Strengths</h3>
                  <ul className="space-y-2">
                    {analysisResult.strengths.map((strength) => (
                      <li key={strength} className="text-sm text-muted flex items-start gap-3">
                        <span className="text-gold text-[12px] mt-[2px]">◆</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-serif text-3xl text-gold-light mb-2">Free Tip</h3>
                  <p className="text-sm text-muted leading-relaxed">{analysisResult.freeTip}</p>
                </div>
              </div>

              <div className="mt-8 border border-gold/30 bg-[rgba(201,169,106,0.08)] p-6 text-center">
                <h4 className="font-serif text-2xl text-gold-light mb-2">Unlock Your Full Potential</h4>
                <p className="text-sm text-muted mb-5">
                  {analysisResult.premiumHook}
                </p>
                <button 
                  onClick={() => analysisResult.id && mint(analysisResult.id)}
                  disabled={isMinting || analysisResult.persisted === false}
                  className="btn-primary w-full max-w-sm mt-4"
                >
                  {analysisResult.persisted === false
                    ? 'Save unavailable while database is offline'
                    : isMinting
                      ? 'Verification in Progress...'
                      : 'Pay with ETH to Unlock Full Report'}
                </button>
                {mintError && <p className="text-red-400 text-[10px] mt-2">{mintError}</p>}
                <p className="text-[11px] text-muted mt-3">or Subscribe with ETH for unlimited</p>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
