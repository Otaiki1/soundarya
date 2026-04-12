"use client";

import { formatEther } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMintScore } from "@/hooks/useMintScore";
import {
    SOUNDARYA_CHAIN_ID,
    SOUNDARYA_SCORE_ABI,
    SOUNDARYA_SCORE_ADDRESS,
} from "@/lib/contracts";
import type { AnalysisPublic } from "@/types/analysis";

type MintState = "CONNECT" | "CONFIRM" | "MINTING" | "SUCCESS";

interface MintScoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: AnalysisPublic;
}

export function MintScoreModal({
    isOpen,
    onClose,
    analysis,
}: MintScoreModalProps) {
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address, chainId: SOUNDARYA_CHAIN_ID });
    const { data: mintPriceWei } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "mintPrice",
    });
    const { mint, isLoading, isSuccess, error, txHash } = useMintScore();

    const mintPriceEth =
        typeof mintPriceWei === "bigint"
            ? formatEther(mintPriceWei)
            : "…";
    const state: MintState = isSuccess
        ? "SUCCESS"
        : isLoading
          ? "MINTING"
          : isConnected
            ? "CONFIRM"
            : "CONNECT";

    const handleMint = async () => {
        if (analysis.id) {
            await mint(analysis.id);
        }
    };

    const handleClose = () => {
        if (state === "SUCCESS") {
            onClose();
        } else if (state !== "MINTING") {
            onClose();
        }
    };

    if (!isOpen) return null;

    const scoreColor =
        analysis.overallScore >= 8
            ? "text-gold"
            : analysis.overallScore >= 7
              ? "text-[#E8D5A3]"
              : "text-gold/70";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-gold/20 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-surface border-b border-gold/10 p-6 flex justify-between items-center">
                    <h1 className="font-serif text-2xl sm:text-3xl text-text">
                        Mint Your Score Onchain
                    </h1>
                    <button
                        onClick={handleClose}
                        disabled={state === "MINTING"}
                        className="text-muted hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    {state === "CONNECT" && (
                        <div className="space-y-6">
                            <p className="text-soft text-sm sm:text-base leading-relaxed">
                                Create a permanent, cryptographically-verified
                                record of your score on Base. Cannot be faked or
                                altered.
                            </p>

                            <div className="border border-gold/20 bg-gold/5 p-6 text-center rounded-sm">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
                                    Your Score
                                </p>
                                <div
                                    className={`font-serif text-6xl sm:text-7xl font-light mb-2 ${scoreColor}`}
                                >
                                    {analysis.overallScore.toFixed(1)}
                                </div>
                                <p className="text-xs text-muted tracking-wide">
                                    {analysis.category}
                                </p>
                            </div>

                            <div className="border border-gold/10 bg-surface p-4 sm:p-5 rounded-sm">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">
                                    Mint Price
                                </p>
                                <p className="font-serif text-xl text-gold">
                                    {mintPriceEth} ETH
                                </p>
                                <p className="text-[11px] text-muted/70 mt-1">
                                    Pulled live from the contract on Base
                                </p>
                            </div>

                            <div className="flex justify-center pt-4">
                                <div className="w-full">
                                    <ConnectButton showBalance={false} />
                                </div>
                            </div>
                        </div>
                    )}

                    {state === "CONFIRM" && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 p-3 bg-gold/5 border border-gold/10 rounded-sm">
                                <span className="text-xs text-muted">
                                    Connected:
                                </span>
                                <span className="font-mono text-xs text-gold">
                                    {address?.slice(0, 6)}...
                                    {address?.slice(-4)}
                                </span>
                                {balance && (
                                    <span className="ml-auto text-xs text-muted">
                                        Balance:{" "}
                                        {parseFloat(balance.formatted).toFixed(
                                            3,
                                        )}{" "}
                                        ETH
                                    </span>
                                )}
                            </div>

                            <div className="border border-gold/20 bg-surface p-6 rounded-sm space-y-4">
                                <div>
                                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
                                        Score Details
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted">
                                                Overall Score:
                                            </span>
                                            <span className="text-gold font-serif">
                                                {analysis.overallScore.toFixed(
                                                    1,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">
                                                Percentile:
                                            </span>
                                            <span className="text-gold">
                                                Top {analysis.percentile}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">
                                                Category:
                                            </span>
                                            <span className="text-gold">
                                                {analysis.category}
                                            </span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gold/10">
                                            <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
                                                Dimensions
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-muted">
                                                        Symmetry:
                                                    </span>
                                                    <span className="text-gold">
                                                        {analysis.symmetryScore.toFixed(
                                                            1,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted">
                                                        Golden Ratio:
                                                    </span>
                                                    <span className="text-gold">
                                                        {analysis.goldenRatioScore.toFixed(
                                                            1,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted">
                                                        Bone Structure:
                                                    </span>
                                                    <span className="text-gold">
                                                        {analysis.boneStructureScore.toFixed(
                                                            1,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted">
                                                        Harmony:
                                                    </span>
                                                    <span className="text-gold">
                                                        {analysis.harmonyScore.toFixed(
                                                            1,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted">
                                                        Skin Quality:
                                                    </span>
                                                    <span className="text-gold">
                                                        {analysis.skinScore.toFixed(
                                                            1,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted">
                                                        Dimorphism:
                                                    </span>
                                                    <span className="text-gold">
                                                        {analysis.dimorphismScore.toFixed(
                                                            1,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gold/20 bg-gold/5 p-4 rounded-sm space-y-2">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-muted font-medium">
                                    What Gets Stored
                                </p>
                                <ul className="space-y-1 text-xs text-soft">
                                    <li className="flex items-start gap-2">
                                        <span className="text-gold mt-0.5">
                                            ✓
                                        </span>
                                        <span>
                                            Permanent onchain record on Base
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gold mt-0.5">
                                            ✓
                                        </span>
                                        <span>
                                            Cryptographic proof of your score
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gold mt-0.5">
                                            ✓
                                        </span>
                                        <span>Leaderboard eligibility</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gold mt-0.5">
                                            ✓
                                        </span>
                                        <span>
                                            DAO governance voting rights
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {error && (
                                <div className="border border-red-500/30 bg-red-500/5 p-4 rounded-sm">
                                    <p className="text-xs text-red-400">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleMint}
                                    disabled={isLoading}
                                    className="flex-1 bg-gold text-surface font-serif py-3 px-4 rounded-sm hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading
                                        ? "Minting..."
                                        : `Mint for ${mintPriceEth} ETH`}
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="px-6 border border-gold/30 text-gold hover:bg-gold/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {state === "MINTING" && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="font-serif text-xl text-text">
                                    Confirming transaction...
                                </p>
                                <p className="text-sm text-muted">
                                    Waiting for Base network confirmation
                                </p>
                            </div>
                            {txHash && (
                                <a
                                    href={`https://basescan.org/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
                                >
                                    {txHash.slice(0, 10)}...{txHash.slice(-8)} ↗
                                </a>
                            )}
                        </div>
                    )}

                    {state === "SUCCESS" && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            {/* Confetti effect */}
                            <style>{`
                @keyframes confetti-fall {
                  to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .confetti {
                  position: fixed;
                  width: 10px;
                  height: 10px;
                  background: #C9A96E;
                  pointer-events: none;
                  animation: confetti-fall 2s ease-in forwards;
                }
              `}</style>

                            <div className="text-5xl">✓</div>
                            <div className="text-center space-y-2">
                                <p className="font-serif text-3xl sm:text-4xl text-text">
                                    Score Minted Successfully
                                </p>
                            </div>

                            <div className="border border-gold/20 bg-gold/5 p-4 rounded-sm w-full text-center">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">
                                    Your Score
                                </p>
                                <p
                                    className={`font-serif text-4xl ${scoreColor}`}
                                >
                                    {analysis.overallScore.toFixed(1)}
                                </p>
                            </div>

                            {txHash && (
                                <a
                                    href={`https://basescan.org/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
                                >
                                    View on Basescan: {txHash.slice(0, 10)}...
                                    {txHash.slice(-8)} ↗
                                </a>
                            )}

                            <div className="flex flex-col w-full gap-2">
                                <a
                                    href={`https://opensea.io/assets/base/${process.env.NEXT_PUBLIC_SCORE_NFT_ADDRESS || process.env.NEXT_PUBLIC_SOUNDARYA_NFT_ADDRESS}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-gold text-surface font-serif py-3 px-4 rounded-sm hover:bg-gold/90 transition-all text-center text-sm"
                                >
                                    View on OpenSea
                                </a>
                                <a
                                    href="https://warpcast.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full border border-gold/30 text-gold hover:bg-gold/5 transition-all rounded-sm py-3 px-4 text-center text-sm"
                                >
                                    Share on Farcaster
                                </a>
                                <button
                                    onClick={handleClose}
                                    className="w-full border border-gold/30 text-gold hover:bg-gold/5 transition-all rounded-sm py-3 px-4 text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
