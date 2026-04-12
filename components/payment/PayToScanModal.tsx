"use client";

import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMintScore } from "@/hooks/useMintScore";
import { SOUNDARYA_CHAIN_ID } from "@/lib/contracts";

type ModalState = "CONNECT" | "CONFIRM" | "PAYING" | "SUCCESS";

interface PayToScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PayToScanModal({
    isOpen,
    onClose,
    onSuccess,
}: PayToScanModalProps) {
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address, chainId: SOUNDARYA_CHAIN_ID });
    const { mint, isLoading, isSuccess, error, txHash } = useMintScore();

    const SCAN_PRICE = "0.001";
    const SCAN_PRICE_USD = "3.50";
    const state: ModalState = isSuccess
        ? "SUCCESS"
        : isLoading
          ? "PAYING"
          : isConnected
            ? "CONFIRM"
            : "CONNECT";

    const handlePay = async () => {
        // In the new flow, we mint based on a specific analysisId.
        // For the standalone modal, we'd need passed-in data or a placeholder.
        await mint("placeholder-id");
    };

    const handleClose = () => {
        if (state === "SUCCESS") {
            onSuccess();
        } else if (state !== "PAYING") {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-gold/20 rounded-sm max-w-xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-surface border-b border-gold/10 p-6 flex justify-between items-center z-10">
                    <h1 className="font-serif text-2xl sm:text-3xl text-text">
                        Unlock Analysis
                    </h1>
                    <button
                        onClick={handleClose}
                        disabled={state === "PAYING"}
                        className="text-muted hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    {state === "CONNECT" && (
                        <div className="space-y-6">
                            <p className="text-soft text-sm sm:text-base leading-relaxed text-center">
                                Connect your wallet to pay {SCAN_PRICE} ETH and unlock your detailed beauty analysis on Base.
                            </p>

                            <div className="border border-gold/10 bg-surface p-4 sm:p-5 rounded-sm text-center">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">
                                    Analysis Price
                                </p>
                                <p className="font-serif text-3xl text-gold">
                                    {SCAN_PRICE} ETH
                                </p>
                                <p className="text-[11px] text-muted/70 mt-1">
                                    (~${SCAN_PRICE_USD})
                                </p>
                            </div>

                            <div className="flex justify-center pt-4">
                                <ConnectButton showBalance={false} />
                            </div>
                        </div>
                    )}

                    {state === "CONFIRM" && (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gold/5 border border-gold/10 rounded-sm">
                                <div>
                                    <span className="text-xs text-muted block md:inline mb-1 md:mb-0 md:mr-2">Connected:</span>
                                    <span className="font-mono text-xs text-gold">
                                        {address?.slice(0, 6)}...{address?.slice(-4)}
                                    </span>
                                </div>
                                {balance && (
                                    <span className="text-xs text-muted">
                                        {parseFloat(balance.formatted).toFixed(3)} ETH
                                    </span>
                                )}
                            </div>

                            <p className="text-soft text-sm text-center leading-relaxed">
                                You are about to pay {SCAN_PRICE} ETH on the Base network to unlock your facial analysis.
                            </p>

                            {error && (
                                <div className="border border-red-500/30 bg-red-500/5 p-4 rounded-sm">
                                    <p className="text-xs text-red-400">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handlePay}
                                    disabled={isLoading}
                                    className="flex-1 bg-gold text-surface font-serif py-3 px-4 rounded-sm hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Pay {SCAN_PRICE} ETH
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

                    {state === "PAYING" && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="font-serif text-xl text-text">
                                    Processing Payment...
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
                            <div className="text-5xl text-gold">✓</div>
                            <div className="text-center space-y-2">
                                <p className="font-serif text-3xl sm:text-4xl text-text">
                                    Payment Successful
                                </p>
                                <p className="text-soft text-sm">
                                    Your analysis is securely unlocked.
                                </p>
                            </div>

                            {txHash && (
                                <a
                                    href={`https://basescan.org/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] border border-gold/30 rounded-sm px-4 py-2 text-gold hover:bg-gold/5 transition-colors flex items-center gap-1"
                                >
                                    View Receipt ↗
                                </a>
                            )}

                            <button
                                onClick={handleClose}
                                className="w-full bg-gold text-surface font-serif py-3 px-4 rounded-sm hover:bg-gold/90 transition-all text-center text-sm"
                            >
                                Continue to Analysis
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
