import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { SOUNDARYA_SCORE_ABI, SOUNDARYA_SCORE_ADDRESS } from "@/lib/contracts";
import { useBaseMainnetGuard } from "@/hooks/useBaseMainnetGuard";
import { analysisIdToContractUint } from "@/lib/scans";
import { getOrCreateSessionId } from "@/lib/session";

export function useUnlockReport() {
  const { address, isConnected } = useAccount();
  const { ensureBaseMainnet } = useBaseMainnetGuard();
  const [pendingMeta, setPendingMeta] = useState<{
    analysisId: string;
    tier: 1 | 2 | 3;
  } | null>(null);

  const { data: unlockPrice } = useReadContract({
    address: SOUNDARYA_SCORE_ADDRESS,
    abi: SOUNDARYA_SCORE_ABI,
    functionName: "unlockPrice",
  });

  const { data: premiumPrice } = useReadContract({
    address: SOUNDARYA_SCORE_ADDRESS,
    abi: SOUNDARYA_SCORE_ABI,
    functionName: "premiumPrice",
  });

  const { data: elitePrice } = useReadContract({
    address: SOUNDARYA_SCORE_ADDRESS,
    abi: SOUNDARYA_SCORE_ABI,
    functionName: "elitePrice",
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  useEffect(() => {
    if (!isConfirmed || !pendingMeta || !address || !txHash) return;

    void fetch("/api/onchain/verify-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisId: pendingMeta.analysisId,
        walletAddress: address,
        txHash,
        sessionId: getOrCreateSessionId(),
      }),
    });
  }, [address, isConfirmed, pendingMeta, txHash]);

  const unlock = async (analysisId: string, tier: 1 | 2 | 3) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    await ensureBaseMainnet();

    const value =
      tier === 3 ? elitePrice : tier === 2 ? premiumPrice : unlockPrice;

    if (typeof value !== "bigint") {
      throw new Error("Unlock price is not available");
    }

    setPendingMeta({ analysisId, tier });
    writeContract({
      address: SOUNDARYA_SCORE_ADDRESS,
      abi: SOUNDARYA_SCORE_ABI,
      functionName: "unlockReport",
      args: [analysisIdToContractUint(analysisId), tier],
      value,
    });
  };

  return {
    unlock,
    isPending,
    isConfirmed,
    txHash,
    prices: {
      unlockPrice,
      premiumPrice,
      elitePrice,
    },
  };
}
