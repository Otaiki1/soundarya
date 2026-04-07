"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-deep text-text">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          Something went wrong
        </p>
        <h1 className="mt-5 font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] text-gold-light">
          We hit an unexpected error.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-soft">
          The page did not load correctly. Try again once, and if the problem
          continues, return to the homepage and restart the flow.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="border border-gold/30 bg-gold/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/15"
          >
            Try Again
          </button>
          <a
            href="/"
            className="border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-soft transition-colors hover:border-gold/30 hover:text-gold"
          >
            Back Home
          </a>
        </div>
      </div>
    </div>
  );
}
