import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { SOUNDARYA_SCORE_ADDRESS, SOUNDARYA_SCORE_ABI } from "@/lib/contracts";

interface UseSubscribeResult {
    subscribeWeekly: () => Promise<void>;
    subscribeMonthly: () => Promise<void>;
    isLoading: boolean;
    isSubscribed: boolean;
    expiry: number;
    error?: string;
    isSuccess: boolean;
    weeklyPrice?: bigint;
    monthlyPrice?: bigint;
    onChainScores: bigint[];
}

export function useSubscribe(): UseSubscribeResult {
    const { address, isConnected } = useAccount();
    const queryClient = useQueryClient();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [verifiedHash, setVerifiedHash] = useState<`0x${string}` | null>(null);

    // Read Subscription Details
    const { data: isSubscribedData, refetch: refetchIsSubscribed } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "isSubscribed",
        args: address ? [address] : undefined,
        query: { enabled: !!address }
    });

    const { data: expiryData, refetch: refetchExpiry } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "subscriptionExpiry",
        args: address ? [address] : undefined,
        query: { enabled: !!address }
    });

    const { data: weeklyPrice } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "weeklySubscriptionPrice",
    });

    const { data: monthlyPrice } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "monthlySubscriptionPrice",
    });

    const { data: onChainScores } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "getUserScores",
        args: address ? [address] : undefined,
        query: { enabled: !!address }
    });

    const { writeContract, data: writeData, error: writeError, isPending: isWritePending } = useWriteContract();
    
    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: writeData,
        confirmations: 1,
    });

    useEffect(() => {
        if (
            isConfirmed &&
            receipt &&
            writeData &&
            writeData !== verifiedHash
        ) {
            setVerifiedHash(writeData);
            setIsLoading(true);
            (async () => {
                try {
                    const res = await fetch("/api/onchain/verify-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            txHash: writeData,
                            type: "subscription",
                            walletAddress: address,
                        }),
                    });

                    if (!res.ok) {
                        console.warn("Subscription mirrored onchain but backend sync failed");
                    }

                    const data = await res.json();
                    queryClient.setQueryData(["paymentVerification", writeData], data);
                } catch (err) {
                    console.warn("Subscription verification warning:", err);
                } finally {
                    const [subscriptionResult, expiryResult] = await Promise.all([
                        refetchIsSubscribed(),
                        refetchExpiry(),
                    ]);

                    const subscriptionActive = Boolean(subscriptionResult.data);

                    if (subscriptionActive) {
                        setError(null);
                        setIsSuccess(true);
                    } else if (
                        typeof expiryResult.data === "bigint" &&
                        Number(expiryResult.data) > 0
                    ) {
                        setError(null);
                        setIsSuccess(true);
                    } else {
                        setError(
                            "Subscription transaction confirmed, but the contract state has not refreshed yet. Please wait a moment and try again.",
                        );
                    }

                    setIsLoading(false);
                }
            })();
        }
    }, [
        address,
        isConfirmed,
        queryClient,
        receipt,
        refetchExpiry,
        refetchIsSubscribed,
        verifiedHash,
        writeData,
    ]);

    useEffect(() => {
        if (writeError) {
            setError(writeError.message || "Transaction failed");
            setIsLoading(false);
        }
    }, [writeError]);

    const subscribeWeekly = useCallback(async () => {
        if (!isConnected || !address) {
            setError("Wallet not connected");
            return;
        }
        if (!weeklyPrice) {
            setError("Price not loaded");
            return;
        }

        setIsLoading(true);
        setError(null);
        setIsSuccess(false);
        setVerifiedHash(null);

        writeContract({
            abi: SOUNDARYA_SCORE_ABI,
            address: SOUNDARYA_SCORE_ADDRESS,
            functionName: "subscribeWeekly",
            value: weeklyPrice as bigint,
        });
    }, [isConnected, address, writeContract, weeklyPrice]);

    const subscribeMonthly = useCallback(async () => {
        if (!isConnected || !address) {
            setError("Wallet not connected");
            return;
        }
        if (!monthlyPrice) {
            setError("Price not loaded");
            return;
        }

        setIsLoading(true);
        setError(null);
        setIsSuccess(false);
        setVerifiedHash(null);

        writeContract({
            abi: SOUNDARYA_SCORE_ABI,
            address: SOUNDARYA_SCORE_ADDRESS,
            functionName: "subscribeMonthly",
            value: monthlyPrice as bigint,
        });
    }, [isConnected, address, writeContract, monthlyPrice]);

    return {
        subscribeWeekly,
        subscribeMonthly,
        isLoading: isLoading || isWritePending || isConfirming,
        isSubscribed: Boolean(isSubscribedData),
        expiry: expiryData ? Number(expiryData) : 0,
        error: error ?? undefined,
        isSuccess,
        weeklyPrice: weeklyPrice as bigint | undefined,
        monthlyPrice: monthlyPrice as bigint | undefined,
        onChainScores: (onChainScores as bigint[]) ?? [],
    };
}
