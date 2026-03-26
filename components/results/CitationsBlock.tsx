interface CitationsBlockProps {
  citations?: string[];
}

export function CitationsBlock({ citations = [] }: CitationsBlockProps) {
  if (!citations.length) return null;

  return (
    <div className="border border-white/8 bg-white/2 p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
        Research citations
      </p>
      <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
        {citations.map((citation) => (
          <li key={citation}>{citation}</li>
        ))}
      </ul>
    </div>
  );
}
