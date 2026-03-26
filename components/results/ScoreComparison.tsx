interface ScoreComparisonProps {
  previousScore: number;
  currentScore: number;
}

export function ScoreComparison({
  previousScore,
  currentScore,
}: ScoreComparisonProps) {
  const delta = Number((currentScore - previousScore).toFixed(1));
  const positive = delta > 0;

  return (
    <div className="grid gap-4 border border-gold/20 bg-gold/5 p-5 sm:grid-cols-3 sm:p-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
          Previous score
        </p>
        <p className="mt-2 font-serif text-4xl text-text">
          {previousScore.toFixed(1)}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
          New score
        </p>
        <p className="mt-2 font-serif text-4xl text-gold">
          {currentScore.toFixed(1)}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
          Delta
        </p>
        <p
          className={`mt-2 inline-flex items-center border px-4 py-2 font-serif text-2xl ${
            positive
              ? "border-gold/30 bg-gold/10 text-gold"
              : "border-white/10 text-muted"
          }`}
        >
          {positive ? "▲" : "•"} {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}
        </p>
      </div>
    </div>
  );
}
