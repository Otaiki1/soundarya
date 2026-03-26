import type { ImprovementPrediction } from "@/types/ai";

interface ImprovementPredictionsProps {
  predictions?: ImprovementPrediction[];
}

export function ImprovementPredictions({
  predictions = [],
}: ImprovementPredictionsProps) {
  if (!predictions.length) return null;

  return (
    <div className="border border-gold/20 bg-gold/5 p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
        Improvement predictions
      </p>
      <div className="mt-4 space-y-4">
        {predictions.map((prediction) => (
          <div key={`${prediction.change}-${prediction.timeframe}`} className="border border-white/8 bg-deep/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text">{prediction.change}</p>
              <span className="font-serif text-xl text-gold">
                +{prediction.deltaScore.toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
              {prediction.timeframe} · {prediction.difficulty}
            </p>
            <p className="mt-2 text-xs text-soft">
              Affects {prediction.affectedDimensions.join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
