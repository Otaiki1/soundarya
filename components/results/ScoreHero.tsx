import type { AnalysisPublic } from '@/types/analysis'

interface ScoreHeroProps {
  analysis: AnalysisPublic
}

export function ScoreHero({ analysis }: ScoreHeroProps) {
  return (
    <div className="flex flex-col items-center lg:items-start text-center lg:text-left py-10">
      <div className="font-serif text-[clamp(6rem,20vw,12rem)] leading-none text-gold font-light mb-6">
        {analysis.overallScore.toFixed(1)}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">OUT OF TOP</p>
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">{analysis.percentile}TH PERCENTILE</p>
      </div>
      
      <div className="mt-12 max-w-md pt-12 border-t border-dashed border-white/5">
        <h2 className="font-serif text-3xl text-text font-light mb-4 italic">{analysis.category}</h2>
        <p className="text-sm leading-relaxed text-soft font-light tracking-wide opacity-60">
          "{analysis.summary}"
        </p>
      </div>
    </div>
  )
}