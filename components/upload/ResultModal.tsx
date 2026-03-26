'use client'

import { useEffect, useState } from 'react'
import { EmailCapture } from '@/components/results/EmailCapture'
import { CitationsBlock } from '@/components/results/CitationsBlock'
import { ImprovementPredictions } from '@/components/results/ImprovementPredictions'
import { useUnlockReport } from '@/hooks/useUnlockReport'
import type { AnalysisPublic } from '@/types/analysis'

interface ResultModalProps {
  result?: AnalysisPublic | null
  analysis?: AnalysisPublic | null
  isOpen: boolean
  onClose: () => void
  onViewFullReport?: () => void
}

const tiers = [
  { tier: 1 as const, label: 'Unlock Report', usd: 3 },
  { tier: 2 as const, label: 'Full Premium', usd: 10 },
  { tier: 3 as const, label: 'Elite', usd: 25 },
]

export function ResultModal({ result, analysis, isOpen, onClose }: ResultModalProps) {
  const resolvedResult = result ?? analysis
  const [ethPrice, setEthPrice] = useState<number | null>(null)
  const { unlock, isPending } = useUnlockReport()

  useEffect(() => {
    if (!isOpen) return
    void fetch('/api/eth-price')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (typeof data?.priceUsd === 'number') setEthPrice(data.priceUsd)
      })
      .catch(() => {})
  }, [isOpen])

  if (!isOpen || !resolvedResult) return null

  const unlockTier = resolvedResult.unlockTier ?? 0
  const premiumVisible = unlockTier >= 2 || resolvedResult.premiumUnlocked
  const eliteVisible = unlockTier >= 3

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-deep/95 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-card border border-white/5 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all animate-[fadeUp_0.5s_ease-out] rounded-sm">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 border border-white/10 text-muted hover:border-gold hover:text-gold flex items-center justify-center transition-all z-20"
        >
          ✕
        </button>

        <div className="p-6 sm:p-8 lg:p-10 border-b border-white/5">
          <div className="eyebrow mb-3 opacity-80">Your Soundarya Report</div>
          <h2 className="font-serif text-3xl lg:text-4xl font-light text-text leading-tight">
            Overall Score: <span className="text-gold">{resolvedResult.overallScore.toFixed(1)}</span>/10
          </h2>
          <p className="mt-3 text-[10px] tracking-[0.15em] uppercase text-muted">Top {resolvedResult.percentile}% Percentile · {resolvedResult.faceArchetype}</p>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 space-y-8">
          {!premiumVisible && resolvedResult.persisted !== false ? (
            <EmailCapture analysisId={resolvedResult.id} />
          ) : null}

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Overall', val: resolvedResult.overallScore.toFixed(1), max: '10' },
              { label: 'Symmetry', val: resolvedResult.symmetryScore, max: '100' },
              { label: 'Harmony', val: resolvedResult.harmonyScore, max: '100' },
              { label: 'Proportion', val: resolvedResult.proportionalityScore, max: '100' },
              { label: 'Averageness', val: resolvedResult.averagenessScore, max: '100' },
            ].map((s) => (
              <div key={s.label} className="bg-surface border border-white/5 p-5 flex flex-col items-center text-center rounded-sm">
                <div className="text-[9px] tracking-[0.2em] uppercase text-muted mb-3 opacity-60">{s.label}</div>
                <div className="font-serif text-3xl font-light text-gold leading-none mb-1">{s.val}</div>
                <div className="text-[10px] text-muted opacity-30">/ {s.max}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-gold-light mb-3">Executive Summary</h3>
                <p className="text-sm leading-relaxed text-soft tracking-wide">{resolvedResult.executiveSummary}</p>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-gold-light mb-3">Key Strengths</h3>
                <ul className="space-y-3">
                  {resolvedResult.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-muted flex gap-4 items-start">
                      <span className="text-gold mt-1 text-[8px]">✦</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/2 border border-white/5 rounded-sm">
                <h3 className="font-serif text-2xl text-gold-light mb-3">Immediate Tip</h3>
                <p className="text-sm leading-relaxed text-soft tracking-wide italic">"{resolvedResult.freeTip}"</p>
              </div>

              {premiumVisible && resolvedResult.weaknesses?.length ? (
                <div className="p-6 bg-white/2 border border-white/5 rounded-sm">
                  <h3 className="font-serif text-2xl text-gold-light mb-3">Weaknesses</h3>
                  <ul className="space-y-2 text-sm text-soft">
                    {resolvedResult.weaknesses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <CitationsBlock citations={premiumVisible ? resolvedResult.citations : []} />
          <ImprovementPredictions predictions={eliteVisible ? resolvedResult.improvementPredictions : []} />

          {!premiumVisible ? (
            <div className="bg-gold/5 border border-gold/20 p-6 sm:p-8 rounded-sm">
              <h4 className="font-serif text-2xl sm:text-3xl text-gold-light mb-3">Unlock your full report</h4>
              <p className="text-sm text-soft max-w-xl mb-6 leading-relaxed">
                Fixed dollar amounts. Live ETH estimates shown using current market price.
              </p>
              <div className="grid gap-3">
                {tiers.map((tier) => (
                  <button
                    key={tier.tier}
                    onClick={() => unlock(resolvedResult.id, tier.tier)}
                    disabled={isPending || resolvedResult.persisted === false}
                    className="flex items-center justify-between border border-gold/20 px-5 py-4 text-left transition-colors hover:border-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="font-serif text-xl text-gold-light">{tier.label}</span>
                    <span className="text-sm text-soft">~{ethPrice ? (tier.usd / ethPrice).toFixed(4) : '...'} ETH · ${tier.usd}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
