"use client";

import { useState } from "react";
import { getOrCreateSessionId } from "@/lib/session";

interface BeautyAssistantProps {
  analysisId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BeautyAssistant({
  analysisId,
  isOpen,
  onClose,
}: BeautyAssistantProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    const content = message.trim();
    setMessages((current) => [...current, { role: "user", content }]);
    setMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          analysisId,
          sessionId: getOrCreateSessionId(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to send message");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error ? error.message : "Unable to answer right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-lg border-l border-gold/20 bg-deep/95 backdrop-blur-lg">
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
            Beauty Assistant
          </p>
          <p className="mt-1 text-sm text-muted">
            Ask about your report, priorities, or presentation strategy.
          </p>
        </div>
        <button onClick={onClose} className="text-sm text-muted hover:text-text">
          ✕
        </button>
      </div>

      <div className="flex h-[calc(100%-84px)] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {messages.length === 0 ? (
            <div className="border border-white/8 bg-white/2 p-4 text-sm text-soft">
              Start with a focused question like “what should I improve first?” or “what styling changes would help my harmony score?”
            </div>
          ) : null}
          {messages.map((entry, index) => (
            <div
              key={`${entry.role}-${index}`}
              className={`max-w-[90%] border p-4 text-sm leading-relaxed ${
                entry.role === "user"
                  ? "ml-auto border-gold/20 bg-gold/8 text-text"
                  : "border-white/8 bg-white/3 text-soft"
              }`}
            >
              {entry.content}
            </div>
          ))}
        </div>
        <div className="border-t border-white/8 px-6 py-5">
          <div className="flex gap-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              className="min-h-[96px] flex-1 border border-white/10 bg-surface px-4 py-3 text-sm text-text outline-none focus:border-gold/40"
              placeholder="Ask the assistant about your score..."
            />
            <button
              onClick={handleSend}
              disabled={isSending}
              className="btn-primary self-end disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
