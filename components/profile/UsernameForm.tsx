"use client";

import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SOUNDARYA_SCORE_ABI, SOUNDARYA_SCORE_ADDRESS } from "@/lib/contracts";

interface UsernameFormProps {
  currentUsername?: string;
}

export function UsernameForm({ currentUsername }: UsernameFormProps) {
  const [username, setUsername] = useState(currentUsername || "");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!username || username === currentUsername) {
      setStatus("idle");
      return;
    }

    const timeout = window.setTimeout(async () => {
      setStatus("checking");
      const response = await fetch(`/api/username/check?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      setStatus(data.available ? "available" : "taken");
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [currentUsername, username]);

  const handleSubmit = async () => {
    setError(null);
    const response = await fetch("/api/username/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update username");
      return;
    }

    writeContract({
      address: SOUNDARYA_SCORE_ADDRESS,
      abi: SOUNDARYA_SCORE_ABI,
      functionName: "setUsername",
      args: [username],
    });
  };

  return (
    <div className="border border-white/8 bg-white/2 p-6">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
        Username
      </p>
      {currentUsername ? (
        <p className="mt-3 text-sm text-soft">Current: @{currentUsername}</p>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase())}
          className="flex-1 border border-white/10 bg-deep px-4 py-3 text-sm text-text outline-none focus:border-gold/40"
          placeholder="choose a username"
        />
        <button
          onClick={handleSubmit}
          disabled={status === "taken" || isPending}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
      <p className="mt-3 text-xs">
        {status === "checking" ? "Checking availability..." : null}
        {status === "available" ? (
          <span className="text-gold">Available</span>
        ) : null}
        {status === "taken" ? <span className="text-red-400">Taken</span> : null}
        {isConfirmed ? <span className="text-gold"> · Onchain updated</span> : null}
      </p>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
