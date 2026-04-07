"use client";

interface DowntimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function DowntimeModal({
  isOpen,
  onClose,
  title = "Uzoza is temporarily unavailable",
  message = "Our analysis engine is experiencing downtime right now. Please come back a little later and try again.",
}: DowntimeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(13,10,7,0.92)] backdrop-blur-md"
        aria-label="Close downtime notice"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl border border-amber-300/20 bg-card p-8 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 h-10 w-10 border border-white/10 text-muted transition-colors hover:border-gold/40 hover:text-gold"
          aria-label="Close downtime notice"
        >
          ✕
        </button>

        <p className="text-[10px] uppercase tracking-[0.26em] text-amber-300">
          Temporary Downtime
        </p>
        <h2 className="mt-4 font-serif text-[clamp(2rem,5vw,3rem)] leading-tight text-gold-light">
          {title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-soft">
          {message}
        </p>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="border border-gold/30 bg-gold/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/15"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
