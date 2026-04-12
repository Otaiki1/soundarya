"use client";

import { useEffect, useRef, useState } from "react";
import { type Hex, zeroAddress } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import {
  SOUNDARYA_CHAIN_ID,
  SOUNDARYA_SCORE_ABI,
  SOUNDARYA_SCORE_ADDRESS,
} from "@/lib/contracts";
import { useBaseMainnetGuard } from "@/hooks/useBaseMainnetGuard";
import { getStoredScans, removeStoredScans } from "@/lib/scans";

export function ClaimScans() {
  const { address, isConnected } = useAccount();
  const { ensureBaseMainnet, isOnBaseMainnet } = useBaseMainnetGuard();
  const publicClient = usePublicClient({ chainId: SOUNDARYA_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const [message, setMessage] = useState<string | null>(null);
  const attemptedWalletRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !publicClient || !isOnBaseMainnet) return;
    if (attemptedWalletRef.current === address.toLowerCase()) return;

    const scans = getStoredScans();
    if (!scans.length) return;
    attemptedWalletRef.current = address.toLowerCase();

    void (async () => {
      try {
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
        const linkedHashes = (
          Array.isArray(data.claimedScanHashes)
            ? data.claimedScanHashes
            : scans.map((scan) => scan.scanHash)
        ) as Hex[];

        const claimedOnchain: Hex[] = [];

        for (const scanHash of linkedHashes) {
          const [isAttested, mappedWallet] = await Promise.all([
            publicClient.readContract({
              address: SOUNDARYA_SCORE_ADDRESS,
              abi: SOUNDARYA_SCORE_ABI,
              functionName: "scanAttested",
              args: [scanHash],
            }),
            publicClient.readContract({
              address: SOUNDARYA_SCORE_ADDRESS,
              abi: SOUNDARYA_SCORE_ABI,
              functionName: "scanToWallet",
              args: [scanHash],
            }),
          ]);

          if (!isAttested) {
            continue;
          }

          if (
            typeof mappedWallet === "string" &&
            mappedWallet !== zeroAddress
          ) {
            if (mappedWallet.toLowerCase() === address.toLowerCase()) {
              claimedOnchain.push(scanHash);
            }
            continue;
          }

          try {
            await ensureBaseMainnet();
            const txHash = await writeContractAsync({
              address: SOUNDARYA_SCORE_ADDRESS,
              abi: SOUNDARYA_SCORE_ABI,
              functionName: "claimScan",
              args: [scanHash],
            });

            await publicClient.waitForTransactionReceipt({ hash: txHash });
            claimedOnchain.push(scanHash);
          } catch (claimError) {
            console.warn("Onchain scan claim skipped:", claimError);
          }
        }

        if (claimedOnchain.length > 0) {
          removeStoredScans(claimedOnchain);
        }

        if (data.linkedCount > 0) {
          const onchainSummary =
            claimedOnchain.length > 0
              ? ` · ${claimedOnchain.length} claimed onchain`
              : "";
          setMessage(`${data.linkedCount} previous scans linked${onchainSummary}`);
          window.setTimeout(() => setMessage(null), 4000);
        }
      } catch (error) {
        console.warn("Claim scan sync failed:", error);
      }
    })();
  }, [address, ensureBaseMainnet, isConnected, isOnBaseMainnet, publicClient, writeContractAsync]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[80] border border-gold/30 bg-surface px-4 py-3 text-sm text-soft shadow-2xl">
      {message}
    </div>
  );
}
