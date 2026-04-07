"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-deep text-text">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
            Critical error
          </p>
          <h1 className="mt-5 font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] text-gold-light">
            The app failed to render.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-soft">
            A full-page error interrupted the application shell. Try reloading
            once. If it keeps happening in production, inspect the latest server
            logs immediately.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={reset}
              className="border border-gold/30 bg-gold/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/15"
            >
              Reload App
            </button>
            <a
              href="/"
              className="border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-soft transition-colors hover:border-gold/30 hover:text-gold"
            >
              Home
            </a>
          </div>
          {error?.digest ? (
            <p className="mt-6 text-xs text-muted">Digest: {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
