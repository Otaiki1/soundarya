import type { AnalysisPublic } from "@/types/analysis";

interface ScoreBarProps {
    label: string;
    score: number;
    maxScore?: number;
}

function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
    const percentage = (score / maxScore) * 100;

    return (
        <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] tracking-[0.14em] uppercase">
                <span className="text-text font-light">{label}</span>
                <span className="text-gold">
                    {score}
                    <span className="text-muted ml-1">/{maxScore}</span>
                </span>
            </div>
            <div className="w-full bg-border/20 h-[3px] rounded-full overflow-hidden">
                <div
                    className="bg-gold h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(201,169,110,0.3)]"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

interface DimensionBarsProps {
    analysis: AnalysisPublic;
}

export function DimensionBars({ analysis }: DimensionBarsProps) {
    const dimensions = [
        { label: "Symmetry", score: analysis.symmetryScore },
        { label: "Harmony", score: analysis.harmonyScore },
        { label: "Proportionality", score: analysis.proportionalityScore },
        { label: "Averageness", score: analysis.averagenessScore },
        { label: "Bone Structure", score: analysis.boneStructureScore },
        { label: "Skin Quality", score: analysis.skinScore },
        { label: "Dimorphism", score: analysis.dimorphismScore },
        { label: "Neoteny", score: analysis.neotenyScore },
        { label: "Adiposity", score: analysis.adiposityScore },
    ];

    return (
        <div className="surface-card p-6 sm:p-8 lg:p-10">
            <div className="mb-8 sm:mb-10">
                <p className="eyebrow mb-3">Aesthetic Breakdown</p>
                <h3 className="font-serif text-2xl lg:text-4xl font-light text-text leading-tight">
                    Beauty <em className="text-gold">Dimensions</em>
                </h3>
            </div>

            <div className="grid lg:grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-7">
                {dimensions.map((dimension) => (
                    <ScoreBar
                        key={dimension.label}
                        label={dimension.label}
                        score={dimension.score}
                    />
                ))}
            </div>

            <div className="mt-8 sm:mt-10 grid md:grid-cols-2 gap-4 sm:gap-5">
                <div className="p-5 sm:p-6 border border-white/8 bg-surface relative overflow-hidden group rounded-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[100px] group-hover:bg-gold/10 transition-colors"></div>
                    <h4 className="font-serif text-xl sm:text-2xl text-gold-light mb-4 tracking-wide">
                        Key Strengths
                    </h4>
                    <ul className="space-y-3">
                        {analysis.strengths.map((strength, index) => (
                            <li
                                key={index}
                                className="flex items-start text-xs leading-relaxed text-soft tracking-wide"
                            >
                                <span className="text-gold mr-3 mt-1.5 text-[8px]">
                                    ✦
                                </span>
                                {strength}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-5 sm:p-6 border border-gold/20 bg-gold/5 relative group transition-all hover:bg-gold/10 hover:border-gold/30 rounded-sm">
                    <h4 className="font-serif text-xl sm:text-2xl text-gold mb-4 tracking-wide italic">
                        Tailored Recommendation
                    </h4>
                    <p className="text-sm leading-relaxed text-text/80 tracking-wide italic">
                        "{analysis.freeTip}"
                    </p>
                    <div className="mt-5 pt-4 border-t border-gold/10 flex justify-between items-center">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-gold">
                            Priority Advice
                        </span>
                        <span className="text-lg text-gold animate-pulse">
                            ✦
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
