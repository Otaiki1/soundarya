"use client";

interface ScoreHistoryGraphProps {
  analyses: Array<{ id: string; overall_score: number; created_at: string }>;
}

export function ScoreHistoryGraph({ analyses }: ScoreHistoryGraphProps) {
  if (!analyses.length) {
    return (
      <div className="border border-white/8 bg-white/2 p-6 text-sm text-muted">
        No scans yet.
      </div>
    );
  }

  const ordered = [...analyses].reverse();
  const width = 720;
  const height = 240;
  const padding = 24;
  const scores = ordered.map((analysis) => Number(analysis.overall_score));
  const max = Math.max(...scores, 10);
  const min = Math.min(...scores, 1);

  const points = ordered.map((analysis, index) => {
    const x =
      padding +
      (index / Math.max(ordered.length - 1, 1)) * (width - padding * 2);
    const score = Number(analysis.overall_score);
    const y =
      height -
      padding -
      ((score - min) / Math.max(max - min, 1)) * (height - padding * 2);

    return {
      ...analysis,
      score,
      x,
      y,
    };
  });

  return (
    <div className="border border-gold/20 bg-gold/5 p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
        Score history
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-6 w-full">
        <path
          d={`M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}`}
          fill="none"
          stroke="rgba(201,169,110,0.95)"
          strokeWidth="3"
        />
        {points.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r="5" fill="#c9a96e" />
            <title>
              {new Date(point.created_at).toLocaleDateString()} · {point.score.toFixed(1)}
            </title>
          </g>
        ))}
      </svg>
    </div>
  );
}
