"use client";

import { useEffect, useState } from "react";
import { getOrCreateSessionId } from "@/lib/session";

interface EmailCaptureProps {
  analysisId: string;
}

const DISMISSED_KEY = "uzoza_email_capture_dismissed";

export function EmailCapture({ analysisId }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const dismissedIds = JSON.parse(
      localStorage.getItem(DISMISSED_KEY) || "[]",
    ) as string[];
    setDismissed(dismissedIds.includes(analysisId));
  }, [analysisId]);

  const persistDismissed = () => {
    const dismissedIds = new Set(
      JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]") as string[],
    );
    dismissedIds.add(analysisId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(dismissedIds)));
    setDismissed(true);
  };

  const handleSubmit = async () => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/collect-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          email,
          sessionId: getOrCreateSessionId(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to send report");
      }

      setSubmitted(true);
      persistDismissed();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send report",
      );
    } finally {
      setIsSending(false);
    }
  };

  if (dismissed) {
    return submitted ? (
      <div className="border border-gold/20 bg-gold/5 p-4 text-sm text-gold-light">
        Sent. Check your inbox for the report.
      </div>
    ) : null;
  }

  return (
    <div className="border border-gold/20 bg-[rgba(201,169,106,0.06)] p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
            Get this report in your inbox
          </p>
          <p className="mt-2 text-sm leading-relaxed text-soft">
            We’ll send this result to your email so you can come back to it later.
          </p>
        </div>
        <button
          onClick={persistDismissed}
          className="text-sm text-muted transition-colors hover:text-text"
          aria-label="Dismiss email capture"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="flex-1 border border-white/10 bg-deep px-4 py-3 text-sm text-text outline-none transition-colors focus:border-gold/40"
        />
        <button
          onClick={handleSubmit}
          disabled={isSending || !email}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>

      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
