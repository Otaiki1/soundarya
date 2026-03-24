'use client'
import type { AnalysisPublic } from '@/types/analysis'

interface ResultModalProps {
  result?: AnalysisPublic | null
  analysis?: AnalysisPublic | null
  isOpen: boolean
  onClose: () => void
  onViewFullReport?: () => void
}

export function ResultModal({ result, analysis, isOpen, onClose, onViewFullReport }: ResultModalProps) {
  const resolvedResult = result ?? analysis

  if (!isOpen || !resolvedResult) return null

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-6">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-deep/95 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative bg-card border border-white/5 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all animate-[fadeUp_0.5s_ease-out] rounded-sm">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 border border-white/10 text-muted hover:border-gold hover:text-gold flex items-center justify-center transition-all z-20"
        >
          ✕
        </button>

        {/* Header */}
        <div className="p-6 sm:p-8 lg:p-10 border-b border-white/5">
          <div className="eyebrow mb-3 opacity-80">Your Soundarya Report</div>
          <h2 className="font-serif text-3xl lg:text-4xl font-light text-text leading-tight">
            Overall Score: <span className="text-gold">{resolvedResult.overallScore.toFixed(1)}</span>/10
          </h2>
          <p className="mt-3 text-[10px] tracking-[0.15em] uppercase text-muted">Top {resolvedResult.percentile}% Percentile</p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 lg:p-10 space-y-8">
          {/* Quick Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Overall', val: resolvedResult.overallScore.toFixed(1), max: '10' },
              { label: 'Symmetry', val: resolvedResult.symmetryScore, max: '100' },
              { label: 'Golden Ratio', val: resolvedResult.goldenRatioScore, max: '100' },
              { label: 'Bone Structure', val: resolvedResult.boneStructureScore, max: '100' }
            ].map((s, i) => (
              <div key={i} className="bg-surface border border-white/5 p-5 flex flex-col items-center text-center rounded-sm">
                <div className="text-[9px] tracking-[0.2em] uppercase text-muted mb-3 opacity-60">{s.label}</div>
                <div className="font-serif text-3xl font-light text-gold leading-none mb-1">{s.val}</div>
                <div className="text-[10px] text-muted opacity-30">/ {s.max}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-gold-light mb-3">Analysis Findings</h3>
                <p className="text-sm leading-relaxed text-soft tracking-wide">{resolvedResult.summary}</p>
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
            </div>
          </div>

          {/* Premium Hook */}
          <div className="bg-gold/5 border border-gold/20 p-6 sm:p-8 text-center rounded-sm">
            <h4 className="font-serif text-2xl sm:text-3xl text-gold-light mb-3">Unlock Your Full Potential</h4>
            <p className="text-sm text-soft max-w-xl mx-auto mb-6 leading-relaxed">
              {resolvedResult.premiumHook}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onViewFullReport}
                disabled={!onViewFullReport}
                className="btn-primary shadow-xl"
              >
                Pay with ETH to Unlock
              </button>
              <button
                onClick={onClose}
                className="btn-secondary text-muted hover:text-gold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
