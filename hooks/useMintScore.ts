import { useState, useCallback, useEffect } from "react";
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { SOUNDARYA_SCORE_ADDRESS, SOUNDARYA_SCORE_ABI } from "@/lib/contracts";

interface MintSignatureResponse {
    signature: string;
    scoreData: {
        analysisId: string;
        nonce: string;
        to: string;
        score: string;
        dim0: string;
        dim1: string;
        dim2: string;
        dim3: string;
        dim4: string;
        dim5: string;
        dim6: string;
    };
    mintPrice: string;
}

interface UseMintScoreResult {
    mint: (analysisId: string) => Promise<void>;
    isLoading: boolean;
    txHash?: string;
    isSuccess: boolean;
    error?: string;
}

export function useMintScore(): UseMintScoreResult {
    const { address, isConnected } = useAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [pendingAnalysisId, setPendingAnalysisId] = useState<string | null>(null);
    const [pendingScoreData, setPendingScoreData] =
        useState<MintSignatureResponse["scoreData"] | null>(null);
    const [verifiedHash, setVerifiedHash] = useState<`0x${string}` | null>(null);

    const { writeContract, data: writeData, isPending: isWritePending } =
        useWriteContract();

    const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash: writeData,
            confirmations: 1,
        });

    useEffect(() => {
        if (
            !isConfirmed ||
            !receipt ||
            !writeData ||
            !pendingAnalysisId ||
            writeData === verifiedHash
        ) {
            return;
        }

        setVerifiedHash(writeData);

        (async () => {
            try {
                const verifyResponse = await fetch("/api/onchain/verify-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        txHash: writeData,
                        type: "mint",
                        analysisId: pendingAnalysisId,
                        walletAddress: address,
                    }),
                });

                let tokenId: string | null = null;
                if (verifyResponse.ok) {
                    const verification = await verifyResponse.json();
                    tokenId =
                        typeof verification.tokenId === "string"
                            ? verification.tokenId
                            : null;
                }

                if (pendingScoreData) {
                    await fetch("/api/onchain/record-mint", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            analysisId: pendingAnalysisId,
                            walletAddress: address,
                            txHash: writeData,
                            scoreData: pendingScoreData,
                            status: tokenId ? "confirmed" : "pending",
                            tokenId,
                        }),
                    });
                }
            } catch (verificationError) {
                console.warn("Mint verification warning:", verificationError);
            } finally {
                setIsSuccess(true);
                setIsLoading(false);
            }
        })();
    }, [
        address,
        isConfirmed,
        pendingAnalysisId,
        pendingScoreData,
        receipt,
        verifiedHash,
        writeData,
    ]);

    const mint = useCallback(
        async (analysisId: string) => {
            if (!isConnected || !address) {
                setError("Wallet not connected");
                return;
            }

            setIsLoading(true);
            setError(null);
            setIsSuccess(false);
            setTxHash(null);
            setVerifiedHash(null);
            setPendingAnalysisId(analysisId);
            setPendingScoreData(null);

            try {
                // Step 1: Get mint signature from API
                const signatureRes = await fetch("/api/onchain/mint-signature", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ analysisId, walletAddress: address }),
                });

                if (!signatureRes.ok) {
                    const errData = await signatureRes.json();
                    throw new Error(errData.error || "Failed to get mint signature");
                }

                const { signature, scoreData, mintPrice } =
                    (await signatureRes.json()) as MintSignatureResponse;
                setPendingScoreData(scoreData);

                // Prepare ScoreData for the contract (Wagmi Expects BigInt for uint256)
                const contractScoreData = {
                    analysisId: BigInt(scoreData.analysisId),
                    nonce: BigInt(scoreData.nonce),
                    to: scoreData.to as `0x${string}`,
                    score: BigInt(scoreData.score),
                    dim0: BigInt(scoreData.dim0),
                    dim1: BigInt(scoreData.dim1),
                    dim2: BigInt(scoreData.dim2),
                    dim3: BigInt(scoreData.dim3),
                    dim4: BigInt(scoreData.dim4),
                    dim5: BigInt(scoreData.dim5),
                    dim6: BigInt(scoreData.dim6),
                };

                // Step 2: Call smart contract to mint
                writeContract(
                    {
                        abi: SOUNDARYA_SCORE_ABI,
                        address: SOUNDARYA_SCORE_ADDRESS as `0x${string}`,
                        functionName: "mintScore",
                        args: [contractScoreData, signature as `0x${string}`],
                        value: parseEther(mintPrice),
                    },
                    {
                        onSuccess: (hash) => {
                            setTxHash(hash);
                        },
                        onError: (err) => {
                            setError(`Transaction failed: ${err.message}`);
                            setIsLoading(false);
                        },
                    },
                );
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Unknown error";
                setError(errorMessage);
                setIsLoading(false);
            }
        },
        [isConnected, address, writeContract],
    );

    return {
        mint,
        isLoading: isLoading || isWritePending || isConfirming,
        txHash: txHash ?? undefined,
        isSuccess,
        error: error ?? undefined,
    };
}
