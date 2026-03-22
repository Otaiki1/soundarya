'use client'
import type { AnalysisPublic } from '@/types/analysis'

interface ResultModalProps {
  result?: AnalysisPublic | null
  analysis?: AnalysisPublic | null
  isOpen: boolean
  onClose: () => void
  onViewFullReport?: () => void
}

export function ResultModal({
  result,
  analysis,
  isOpen,
  onClose,
  onViewFullReport,
}: ResultModalProps) {
  const resolvedResult = result ?? analysis

  if (!isOpen || !resolvedResult) return null

  return (
    <div className={`fixed inset-0 z-[1000] overflow-y-auto bg-deep transition-all duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`min-h-screen flex flex-col transition-transform duration-1000 ${isOpen ? 'translate-y-0' : 'translate-y-20'} var(--ease-expo)`}>
        
        {/* Navigation / Actions */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 w-full pt-8 sm:pt-12 flex justify-between items-center">
          <div className="eyebrow opacity-60">Aesthetic Report</div>
          <button
            onClick={onClose}
            className="group flex items-center gap-4 text-[10px] tracking-[0.3em] uppercase text-muted hover:text-gold transition-colors"
          >
            Close Index <span className="w-8 h-[1px] bg-border-light group-hover:bg-gold transition-colors"></span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 w-full flex-1 py-16 sm:py-24 flex flex-col justify-center">
          <div className="max-w-5xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-20 items-center reveal">
              {/* Left Score */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="font-serif text-[clamp(6rem,18vw,12rem)] leading-none text-gold font-light mb-4">
                  {resolvedResult.overallScore.toFixed(1)}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] tracking-[0.3em] text-muted uppercase">OUT OF TOP</p>
                  <p className="text-[10px] tracking-[0.3em] text-muted uppercase">{resolvedResult.percentile}TH PERCENTILE</p>
                </div>
              </div>

              {/* Right Metrics */}
              <div className="space-y-8">
                {[
                  { label: "Symmetry", val: resolvedResult.symmetryScore },
                  { label: "Golden Ratio", val: resolvedResult.goldenRatioScore },
                  { label: "Proportion", val: resolvedResult.harmonyScore },
                  { label: "Harmony", val: resolvedResult.boneStructureScore },
                ].map((item) => (
                  <div key={item.label} className="relative group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] tracking-[0.2em] text-muted uppercase opacity-40 group-hover:opacity-100 transition-opacity">
                        {item.label}
                      </span>
                      <span className="text-[14px] text-gold font-serif opacity-40 group-hover:opacity-100 transition-opacity">
                        {item.val}%
                      </span>
                    </div>
                    <div className="h-[1px] bg-white/5 relative overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gold/50 w-full origin-left transition-transform duration-1000 ease-out"
                        style={{ transform: `scaleX(${item.val / 100})` }}
                      ></div>
                    </div>
                  </div>
                ))}

                <div className="pt-8">
                    <button
                      onClick={onViewFullReport}
                      disabled={!onViewFullReport}
                      className="btn-gold-gradient w-full py-4 text-[10px]"
                    >
                      UNLOCK FULL EVALUATION — $19
                    </button>
                </div>
              </div>
            </div>

            {/* Quote / Insight Footer */}
            <div className="mt-24 pt-12 border-t border-dashed border-white/5 text-center reveal">
              <p className="text-sm text-soft italic font-light tracking-wide opacity-60 max-w-2xl mx-auto leading-relaxed">
                "{resolvedResult.summary}"
                <span className="ml-4 inline-flex items-center gap-2 opacity-40 not-italic">× ✦</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
