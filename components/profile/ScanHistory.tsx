import { personalizeReportText } from "@/lib/report-copy";

interface ScanHistoryAnalysis {
  id: string;
  overall_score: number;
  category: string;
  summary: string;
  created_at: string;
  unlock_tier?: number | null;
}

interface ScanHistoryProps {
  analyses: ScanHistoryAnalysis[];
}

export function ScanHistory({ analyses }: ScanHistoryProps) {
  if (!analyses.length) {
    return (
      <div className="border border-white/8 bg-white/2 p-6 text-sm text-muted">
        No scan history yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <a
          key={analysis.id}
          href={`/analyse/${analysis.id}`}
          className="grid gap-4 border border-white/8 bg-white/2 p-5 transition-colors hover:border-gold/25 sm:grid-cols-[140px_1fr_auto]"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              Score
            </p>
            <p className="mt-2 font-serif text-5xl text-gold">
              {Number(analysis.overall_score).toFixed(1)}
            </p>
          </div>
          <div>
            <p className="font-serif text-2xl text-text">{analysis.category}</p>
            <p className="mt-2 text-sm leading-relaxed text-soft">
              {personalizeReportText(analysis.summary)}
            </p>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{new Date(analysis.created_at).toLocaleDateString()}</p>
            <p className="mt-2">Tier {analysis.unlock_tier ?? 0}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
