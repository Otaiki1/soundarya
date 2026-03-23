import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";

interface UseSubscribeResult {
    subscribe: (subPrice?: string) => Promise<void>;
    isLoading: boolean;
    isSubscribed: boolean;
    expiry: number;
    error?: string;
    isSuccess: boolean;
}

// Minimal ABI for the payments contract
const paymentsAbi = [
    {
        type: "function",
        name: "subscribe",
        inputs: [],
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        name: "isSubscribed",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "subscriptionExpiry",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    }
] as const;

export function useSubscribe(): UseSubscribeResult {
    const { address, isConnected } = useAccount();
    const queryClient = useQueryClient();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const contractAddress = (process.env.NEXT_PUBLIC_SOUNDARYA_PAYMENTS_ADDRESS || "") as `0x${string}`;

    const { data: isSubscribedData, refetch: refetchIsSubscribed } = useReadContract({
        address: contractAddress,
        abi: paymentsAbi,
        functionName: "isSubscribed",
        args: address ? [address] : undefined,
        query: { enabled: !!address }
    });

    const { data: expiryData, refetch: refetchExpiry } = useReadContract({
        address: contractAddress,
        abi: paymentsAbi,
        functionName: "subscriptionExpiry",
        args: address ? [address] : undefined,
        query: { enabled: !!address }
    });

    const { writeContract, data: writeData, error: writeError, isPending: isWritePending } = useWriteContract();
    
    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: writeData,
        confirmations: 1,
    });

    useEffect(() => {
        if (isConfirmed && receipt && !isSuccess && writeData && !isLoading) {
            setIsLoading(true);
            (async () => {
                try {
                    const res = await fetch("/api/onchain/verify-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            txHash: writeData,
                            type: "subscription"
                        }),
                    });

                    if (!res.ok) {
                        throw new Error("Failed to verify subscription with backend");
                    }
                    
                    const data = await res.json();
                    queryClient.setQueryData(['paymentVerification', writeData], data);
                    
                    // Refetch read contracts to update UI state
                    await Promise.all([refetchIsSubscribed(), refetchExpiry()]);
                    setIsSuccess(true);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Verification failed");
                } finally {
                    setIsLoading(false);
                }
            })();
        }
    }, [isConfirmed, receipt, writeData, isSuccess, queryClient, refetchIsSubscribed, refetchExpiry, isLoading]);

    useEffect(() => {
        if (writeError) {
            setError(writeError.message);
            setIsLoading(false);
        }
    }, [writeError]);

    const subscribe = useCallback(async (subPrice: string = "0.01") => {
        if (!isConnected || !address) {
            setError("Wallet not connected");
            return;
        }

        setIsLoading(true);
        setError(null);
        setIsSuccess(false);

        writeContract({
            abi: paymentsAbi,
            address: contractAddress,
            functionName: "subscribe",
            value: parseEther(subPrice),
        }, {
            onSuccess: () => {
                // kept loading while waiting for receipt
            },
            onError: (err) => {
                setError(`Transaction failed: ${err.message}`);
                setIsLoading(false);
            }
        });
    }, [isConnected, address, writeContract, contractAddress]);

    return {
        subscribe,
        isLoading: isLoading || isWritePending || isConfirming,
        isSubscribed: Boolean(isSubscribedData),
        expiry: expiryData ? Number(expiryData) : 0,
        error: error ?? undefined,
        isSuccess
    };
}
