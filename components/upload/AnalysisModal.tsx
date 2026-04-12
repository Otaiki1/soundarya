'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { formatEther } from 'viem'
import { useSubscribe } from '@/hooks/useSubscribe'
import { useUnlockReport } from '@/hooks/useUnlockReport'
import { BeautyAssistant } from '@/components/assistant/BeautyAssistant'
import { CitationsBlock } from '@/components/results/CitationsBlock'
import { EmailCapture } from '@/components/results/EmailCapture'
import { ImprovementPredictions } from '@/components/results/ImprovementPredictions'
import { MintScoreModal } from '@/components/web3/MintScoreModal'
import type { AnalysisPublic } from '@/types/analysis'
import { getOrCreateSessionId } from '@/lib/session'

type ModalState = 'LOADING' | 'RESULT'

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  imageFile: File | null
  analysisResult: AnalysisPublic | null
}

const STAGES = [
  'Mapping landmarks',
  'Scoring symmetry and harmony',
  'Evaluating proportionality and averageness',
  'Assessing neoteny and adiposity',
  'Writing your report',
]

export function AnalysisModal({ isOpen, onClose, imageFile, analysisResult }: AnalysisModalProps) {
  const [visibleStageIndex, setVisibleStageIndex] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [ethPrice, setEthPrice] = useState<number | null>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [resolvedAnalysis, setResolvedAnalysis] = useState<AnalysisPublic | null>(analysisResult)
  const { isSubscribed } = useSubscribe()
  const { unlock, isPending, isConfirmed, prices } = useUnlockReport()
  const [mintModalOpen, setMintModalOpen] = useState(false)

  useEffect(() => {
    setResolvedAnalysis(analysisResult)
  }, [analysisResult])

  useEffect(() => {
    if (!isOpen || analysisResult) return
    setVisibleStageIndex(0)

    const interval = setInterval(() => {
      setVisibleStageIndex((prev) => (prev >= STAGES.length - 1 ? prev : prev + 1))
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

  useEffect(() => {
    if (!isOpen) return

    void fetch('/api/eth-price')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (typeof data?.priceUsd === 'number') {
          setEthPrice(data.priceUsd)
        }
      })
      .catch(() => {})
  }, [isOpen])

  useEffect(() => {
    if (!isConfirmed || !resolvedAnalysis?.id) return

    void fetch(`/api/analyse/${resolvedAnalysis.id}?sessionId=${getOrCreateSessionId()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) {
          setResolvedAnalysis(data)
        }
      })
      .catch(() => {})
  }, [isConfirmed, resolvedAnalysis?.id])

  const modalState: ModalState = useMemo(() => {
    if (!resolvedAnalysis) return 'LOADING'
    return 'RESULT'
  }, [resolvedAnalysis])

  const unlockTier = resolvedAnalysis?.unlockTier ?? 0
  const hasPremium = isSubscribed || unlockTier >= 2 || resolvedAnalysis?.premiumUnlocked
  const hasElite = unlockTier >= 3

  const tierOptions = useMemo(
    () =>
      [
        { tier: 1 as const, label: 'Unlock Report', wei: prices.unlockPrice },
        { tier: 2 as const, label: 'Full Premium', wei: prices.premiumPrice },
        { tier: 3 as const, label: 'Elite', wei: prices.elitePrice },
      ] as const,
    [prices.elitePrice, prices.premiumPrice, prices.unlockPrice],
  )

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-1000 flex items-center justify-center bg-[rgba(13,10,7,0.96)] backdrop-blur-lg p-4 sm:p-6">
        <div className="relative w-[92%] max-w-[960px] max-h-[88vh] overflow-y-auto bg-card border border-gold/20 animate-[modalIn_400ms_ease-out_forwards]">
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
              <p className="text-[11px] uppercase tracking-[0.15em] text-muted mb-10">Uzoza Oracle · 9 dimensions</p>

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

          {resolvedAnalysis && (
            <>
              <div className="p-6 sm:p-8 border-b border-gold/20">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-3">Your Uzoza Report</p>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] text-gold-light leading-tight">
                      {resolvedAnalysis.overallScore.toFixed(1)}/10 · Top {resolvedAnalysis.percentile}%
                    </h2>
                    <p className="mt-2 text-sm text-soft">
                      {resolvedAnalysis.category} · Archetype {resolvedAnalysis.faceArchetype}
                    </p>
                  </div>
                  {resolvedAnalysis.confidenceScore < 0.5 ? (
                    <span className="border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-amber-300">
                      Low confidence image
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                <div className="grid lg:grid-cols-[220px_1fr] gap-6 lg:gap-8">
                  <div className="w-[200px] h-[200px] border border-gold/30 overflow-hidden bg-surface">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Uploaded face preview" className="w-full h-full object-cover" />
                    ) : null}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {[
                      { label: 'Symmetry', score: resolvedAnalysis.symmetryScore },
                      { label: 'Harmony', score: resolvedAnalysis.harmonyScore },
                      { label: 'Proportionality', score: resolvedAnalysis.proportionalityScore },
                      { label: 'Averageness', score: resolvedAnalysis.averagenessScore },
                      { label: 'Structure', score: resolvedAnalysis.boneStructureScore },
                      { label: 'Skin', score: resolvedAnalysis.skinScore },
                      { label: 'Dimorphism', score: resolvedAnalysis.dimorphismScore },
                      { label: 'Neoteny', score: resolvedAnalysis.neotenyScore },
                      { label: 'Adiposity', score: resolvedAnalysis.adiposityScore },
                    ].map((metric) => {
                      const progress = Math.max(0, Math.min(100, metric.score))
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
                            <div className="absolute inset-y-0 left-0 bg-gold-bright transition-all duration-1000 ease-expo" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {resolvedAnalysis.persistenceError ? (
                  <div className="border border-amber-400/30 bg-amber-500/8 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-amber-300 mb-2">Temporary Result</p>
                    <p className="text-sm text-amber-100/80 leading-relaxed">
                      {resolvedAnalysis.persistenceError}
                    </p>
                  </div>
                ) : null}

                {!hasPremium && resolvedAnalysis.persisted !== false ? (
                  <EmailCapture analysisId={resolvedAnalysis.id} />
                ) : null}

                <div>
                  <h3 className="font-serif text-3xl text-gold-light mb-2">Executive Summary</h3>
                  <p className="text-sm text-muted leading-relaxed">{resolvedAnalysis.executiveSummary}</p>
                </div>

                <div>
                  <h3 className="font-serif text-3xl text-gold-light mb-2">Your Strengths</h3>
                  <ul className="space-y-2">
                    {resolvedAnalysis.strengths.map((strength) => (
                      <li key={strength} className="text-sm text-muted flex items-start gap-3">
                        <span className="text-gold text-[12px] mt-[2px]">◆</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasPremium && resolvedAnalysis.weaknesses?.length ? (
                  <div>
                    <h3 className="font-serif text-3xl text-gold-light mb-2">Weaknesses</h3>
                    <ul className="space-y-2">
                      {resolvedAnalysis.weaknesses.map((item) => (
                        <li key={item} className="text-sm text-muted flex items-start gap-3">
                          <span className="text-gold text-[12px] mt-[2px]">◆</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <h3 className="font-serif text-3xl text-gold-light mb-2">Free Tip</h3>
                  <p className="text-sm text-muted leading-relaxed">{resolvedAnalysis.freeTip}</p>
                </div>

                {hasPremium && resolvedAnalysis.premiumTips?.length ? (
                  <div>
                    <h3 className="font-serif text-3xl text-gold-light mb-2">Premium Guidance</h3>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {resolvedAnalysis.premiumTips.map((tip) => (
                        <li key={tip} className="border border-white/8 bg-white/2 p-4 text-sm text-soft">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <CitationsBlock citations={resolvedAnalysis.citations} />
                <ImprovementPredictions predictions={resolvedAnalysis.improvementPredictions} />

                {!hasPremium ? (
                  <div className="border border-gold/30 bg-[rgba(201,169,106,0.08)] p-6">
                    <h4 className="font-serif text-2xl text-gold-light mb-3">Choose the depth of your reading</h4>
                    <p className="text-sm text-muted mb-6">
                      Fixed dollar amounts. Live ETH estimate shown using the current market price.
                    </p>
                    <div className="grid gap-3">
                      {tierOptions.map((option) => {
                        const wei = option.wei
                        const ethStr =
                          typeof wei === 'bigint' ? Number(formatEther(wei)).toFixed(4) : '…'
                        const usdStr =
                          typeof wei === 'bigint' && ethPrice
                            ? `~$${Math.round(Number(formatEther(wei)) * ethPrice)}`
                            : null
                        return (
                          <button
                            key={option.tier}
                            onClick={() => unlock(resolvedAnalysis.id, option.tier)}
                            disabled={isPending || resolvedAnalysis.persisted === false}
                            className="flex flex-col gap-1 border border-gold/20 bg-deep/40 px-5 py-4 text-left transition-colors hover:border-gold/40 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="font-serif text-xl text-gold-light">{option.label}</span>
                            <span className="text-sm text-soft">
                              ~{ethStr} ETH{usdStr ? ` · ${usdStr}` : ''} · contract price
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setAssistantOpen(true)} className="btn-primary">
                      Open Beauty Assistant
                    </button>
                  </div>
                )}

                {resolvedAnalysis.persisted !== false ? (
                  <div className="border border-gold/25 bg-[rgba(201,169,106,0.06)] p-6">
                    <h3 className="font-serif text-2xl text-gold-light mb-2">Own it onchain</h3>
                    <p className="text-sm text-muted leading-relaxed mb-5">
                      Unlock any paid tier above, then mint your score as an NFT on Base — permanent proof for leaderboards and your wallet. You can also open the full report page to share or mint from there.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/analyse/${resolvedAnalysis.id}`}
                        className="btn-secondary inline-flex items-center justify-center text-[0.65rem] uppercase tracking-[0.22em]"
                      >
                        Open full report
                      </Link>
                      {unlockTier > 0 ? (
                        <button
                          type="button"
                          onClick={() => setMintModalOpen(true)}
                          className="btn-primary text-[0.65rem] uppercase tracking-[0.22em]"
                        >
                          Mint on Base
                        </button>
                      ) : (
                        <p className="self-center text-[11px] uppercase tracking-[0.16em] text-soft/70">
                          Mint unlocks after a paid tier
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
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
      <BeautyAssistant
        analysisId={resolvedAnalysis?.id}
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
      {resolvedAnalysis ? (
        <MintScoreModal
          isOpen={mintModalOpen}
          onClose={() => setMintModalOpen(false)}
          analysis={resolvedAnalysis}
        />
      ) : null}
    </>
  )
}
