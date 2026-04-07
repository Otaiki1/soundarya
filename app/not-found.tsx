import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-deep text-text">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          Error 404
        </p>
        <h1 className="mt-5 font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] text-gold-light">
          This page could not be found.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-soft">
          The link may be expired, private, or no longer available. If this was
          your analysis, go back to the upload flow and open it again from your
          current session.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="border border-gold/30 bg-gold/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/15"
          >
            Back Home
          </Link>
          <Link
            href="/upload"
            className="border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-soft transition-colors hover:border-gold/30 hover:text-gold"
          >
            Upload Photo
          </Link>
        </div>
      </div>
    </div>
  );
}
