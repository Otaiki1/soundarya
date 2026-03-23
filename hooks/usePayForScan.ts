import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";

interface UsePayForScanResult {
    pay: (scanPrice?: string) => Promise<void>;
    isLoading: boolean;
    txHash?: string;
    isSuccess: boolean;
    error?: string;
}

export function usePayForScan(): UsePayForScanResult {
    const { address, isConnected } = useAccount();
    const queryClient = useQueryClient();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { writeContract, data: writeData, error: writeError, isPending: isWritePending } = useWriteContract();
    
    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: writeData,
        confirmations: 1,
    });

    // Handle the backend trigger upon confirmation
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
                            type: "scan"
                        }),
                    });

                    if (!res.ok) {
                        throw new Error("Failed to verify payment with backend");
                    }
                    
                    const data = await res.json();
                    
                    // Store response in React Query cache
                    queryClient.setQueryData(['paymentVerification', writeData], data);
                    
                    setIsSuccess(true);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Verification failed");
                } finally {
                    setIsLoading(false);
                }
            })();
        }
    }, [isConfirmed, receipt, writeData, isSuccess, queryClient, isLoading]);

    useEffect(() => {
        if (writeError) {
            setError(writeError.message);
            setIsLoading(false);
        }
    }, [writeError]);

    const pay = useCallback(async (scanPrice: string = "0.001") => {
        if (!isConnected || !address) {
            setError("Wallet not connected");
            return;
        }

        setIsLoading(true);
        setError(null);
        setIsSuccess(false);
        setTxHash(null);

        writeContract({
            abi: [{
                type: "function",
                name: "payForScan",
                inputs: [],
                outputs: [],
                stateMutability: "payable",
            }],
            address: (process.env.NEXT_PUBLIC_SOUNDARYA_PAYMENTS_ADDRESS || "") as `0x${string}`,
            functionName: "payForScan",
            value: parseEther(scanPrice),
        }, {
            onSuccess: (hash) => {
                setTxHash(hash);
                // We keep isLoading true because we are waiting for confirmation and verification
            },
            onError: (err) => {
                setError(`Transaction failed: ${err.message}`);
                setIsLoading(false);
            }
        });
    }, [isConnected, address, writeContract]);

    return {
        pay,
        isLoading: isLoading || isWritePending || isConfirming,
        txHash: txHash ?? undefined,
        isSuccess,
        error: error ?? undefined,
    };
}
