import type { AnalysisPublic } from "@/types/analysis";

interface ScoreHeroProps {
    analysis: AnalysisPublic;
}

export function ScoreHero({ analysis }: ScoreHeroProps) {
    return (
        <div className="surface-card p-6 sm:p-8 lg:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[120px] -z-10 rounded-full opacity-50"></div>

            <div className="mb-8">
                <p className="eyebrow mb-4 opacity-80">Your Soundarya Score</p>
                <div className="font-serif text-[clamp(3.5rem,12vw,8rem)] font-light text-gold leading-none mb-3">
                    {analysis.overallScore.toFixed(1)}
                </div>
                <div className="text-[11px] text-muted tracking-[0.2em] uppercase mb-6 opacity-70">
                    out of 10
                </div>
                <div className="inline-flex items-center px-5 py-2 border border-gold/20 text-[10px] tracking-[0.2em] uppercase text-gold bg-gold/5 rounded-sm">
                    {analysis.category}
                </div>
            </div>

            <div className="mb-8">
                <div className="font-serif text-2xl lg:text-4xl font-light text-text mb-3 leading-tight">
                    Top <em className="text-gold">{analysis.percentile}%</em> of
                    Analyzed Faces
                </div>
                <p className="text-[10px] tracking-[0.16em] text-muted uppercase opacity-60">
                    Global Aesthetic Ranking
                </p>
            </div>

            <div className="max-w-3xl mx-auto border-t border-white/5 pt-6 sm:pt-8">
                <p className="text-sm sm:text-base leading-relaxed text-soft tracking-wide font-light italic">
                    "{analysis.summary}"
                </p>
            </div>
        </div>
    );
}
