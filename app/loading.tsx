export default function Loading() {
  return (
    <div className="min-h-screen bg-deep text-text">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="h-14 w-14 rounded-full border border-gold/20 border-t-gold animate-spin" />
        <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-gold">
          Loading
        </p>
        <p className="mt-3 text-sm text-soft">
          Preparing your Uzoza experience.
        </p>
      </div>
    </div>
  );
}
