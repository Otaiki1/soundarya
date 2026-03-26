"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getStoredScans, removeStoredScans } from "@/lib/scans";

export function ClaimScans() {
  const { address, isConnected } = useAccount();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    const scans = getStoredScans();
    if (!scans.length) return;

    void (async () => {
      const response = await fetch("/api/onchain/claim-scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          scanHashes: scans.map((scan) => scan.scanHash),
        }),
      });

      if (!response.ok) return;
      const data = await response.json();
      if (data.linkedCount > 0) {
        removeStoredScans(data.claimedScanHashes || scans.map((scan) => scan.scanHash));
        setMessage(`${data.linkedCount} previous scans linked to your wallet`);
        window.setTimeout(() => setMessage(null), 3000);
      }
    })();
  }, [address, isConnected]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[80] border border-gold/30 bg-surface px-4 py-3 text-sm text-soft shadow-2xl">
      {message}
    </div>
  );
}
