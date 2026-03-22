import type { AnalysisPublic } from '@/types/analysis'

interface ScoreBarProps {
  label: string
  score: number
  maxScore?: number
}

function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100

  return (
    <div className="relative group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] tracking-[0.2em] text-muted uppercase opacity-40 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
        <span className="text-[13px] text-gold font-serif opacity-40 group-hover:opacity-100 transition-opacity">
          {score}%
        </span>
      </div>
      <div className="h-[1px] bg-white/5 relative overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gold/50 w-full origin-left transition-transform duration-1000 ease-out"
          style={{ transform: `scaleX(${percentage / 100})` }}
        />
      </div>
    </div>
  )
}

interface DimensionBarsProps {
  analysis: AnalysisPublic
}

export function DimensionBars({ analysis }: DimensionBarsProps) {
  const dimensions = [
    { label: 'Symmetry', score: analysis.symmetryScore },
    { label: 'Golden Ratio', score: analysis.goldenRatioScore },
    { label: 'Proportion', score: analysis.harmonyScore },
    { label: 'Harmony', score: analysis.boneStructureScore },
  ]

  return (
    <div className="space-y-16">
      <div className="grid lg:grid-cols-2 gap-x-8 gap-y-10">
        {dimensions.map((dimension) => (
          <ScoreBar
            key={dimension.label}
            label={dimension.label}
            score={dimension.score}
          />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        <div className="p-8 border border-border-light bg-surface/50 relative overflow-hidden group rounded-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[100px] group-hover:bg-gold/10 transition-colors"></div>
          <p className="text-[10px] tracking-[0.2em] text-gold uppercase mb-6 opacity-80">Key Strengths</p>
          <ul className="space-y-4">
            {analysis.strengths.slice(0, 3).map((strength, index) => (
              <li key={index} className="flex items-start text-[11px] leading-relaxed text-soft tracking-wide font-light">
                <span className="text-gold mr-3 mt-1.5 text-[6px]">◆</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-8 border border-gold/20 bg-gold-glow/20 relative group transition-all hover:bg-gold-glow/30 rounded-sm flex flex-col justify-center">
          <p className="text-[10px] tracking-[0.2em] text-gold uppercase mb-6 opacity-80 italic">Priority Advice</p>
          <p className="text-sm leading-relaxed text-text font-light italic">
            "{analysis.freeTip}"
          </p>
          <div className="mt-8 flex justify-end opacity-40">
            <span className="text-xl text-gold">✦</span>
          </div>
        </div>
      </div>
    </div>
  )
}