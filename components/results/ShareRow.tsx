"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { MintScoreModal } from "@/components/web3/MintScoreModal";
import { useSubscribe } from "@/hooks/useSubscribe";
import type { AnalysisPublic } from "@/types/analysis";

interface ShareRowProps {
    analysis: AnalysisPublic;
}

export function ShareRow({ analysis }: ShareRowProps) {
    const router = useRouter();
    const { isConnected } = useAccount();
    const { isSubscribed } = useSubscribe();
    const [copied, setCopied] = useState(false);
    const [isMintModalOpen, setIsMintModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [canRescan, setCanRescan] = useState(false);

    const analysisId = analysis.id;
    const createdAt = new Date(analysis.createdAt).getTime();
    const nextScanAt = createdAt + 7 * 24 * 60 * 60 * 1000; // 7 days later

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            const diff = nextScanAt - now;

            if (diff <= 0) {
                setCanRescan(true);
                setTimeLeft("");
                clearInterval(timer);
            } else {
                setCanRescan(false);
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextScanAt]);

    // Safe way to get origin on client
    const getOrigin = () => {
        if (typeof window !== "undefined") return window.location.origin;
        return "";
    };

    const shareUrl = `${getOrigin()}/analyse/${analysisId}`;
    const isPersisted = analysis.persisted !== false;

    const handleCopyLink = async () => {
        if (!isPersisted) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="surface-card p-6 sm:p-8 lg:p-10">
                <div className="mb-6 sm:mb-8">
                    <p className="eyebrow mb-3">Community</p>
                    <h3 className="font-serif text-2xl lg:text-4xl font-light text-text leading-tight">
                        Share Your <em className="text-gold">Results</em>
                    </h3>
                    {!isPersisted && (
                        <p className="mt-4 text-sm text-amber-200/80">
                            This result is temporary and cannot be shared or minted until database connectivity is restored.
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleCopyLink}
                        disabled={!isPersisted}
                        className={`flex items-center justify-center gap-3 px-6 py-4 border text-[10px] tracking-[0.16em] uppercase transition-all rounded-sm disabled:cursor-not-allowed disabled:opacity-40 ${copied ? "border-gold text-gold bg-gold/5" : "border-white/10 text-muted hover:border-gold hover:text-gold hover:bg-gold/5"}`}
                    >
                        <span className="text-base">{copied ? "✓" : "🔗"}</span>
                        {copied ? "Copied" : "Copy Shared Report"}
                    </button>
                    
                    <button
                        onClick={() => setIsMintModalOpen(true)}
                        disabled={!isPersisted}
                        className="flex items-center justify-center gap-3 px-6 py-4 border border-gold text-gold bg-gold/5 text-[10px] tracking-[0.16em] uppercase hover:bg-gold/10 transition-all rounded-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="text-base">✦</span>
                        Mint Onchain NFT
                    </button>

                    <button
                        onClick={() => router.push("/leaderboard")}
                        className="flex items-center justify-center gap-3 px-6 py-4 border border-white/10 text-muted hover:border-gold hover:text-gold hover:bg-gold/5 text-[10px] tracking-[0.16em] uppercase transition-all rounded-sm"
                    >
                        <span className="text-base">🏆</span>
                        View Leaderboard
                    </button>
                </div>
            </div>

            <div className="surface-card p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="eyebrow mb-3">Continuous Improvement</p>
                        <h3 className="font-serif text-2xl lg:text-4xl font-light text-text leading-tight">
                            Track Your <em className="text-gold">Evolution</em>
                        </h3>
                        <p className="mt-4 text-sm text-soft font-light max-w-xl">
                            Uzoza is designed for long-term tracking. Rescan every week to see how your facial harmony evolves with better grooming and health.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 bg-surface border border-white/5 min-w-[240px] rounded-sm">
                        {!canRescan ? (
                            <>
                                <p className="text-[10px] tracking-[0.25em] text-muted uppercase mb-4">Next scan in</p>
                                <div className="font-serif text-3xl text-gold mb-2">{timeLeft}</div>
                                <div className="w-full h-1 bg-white/5 mt-4 relative overflow-hidden">
                                    <div 
                                        className="absolute inset-y-0 left-0 bg-gold/30 transition-all duration-1000"
                                        style={{ width: `${Math.max(0, Math.min(100, (1 - (nextScanAt - Date.now()) / (7 * 24 * 60 * 60 * 1000)) * 100))}%` }}
                                    ></div>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => router.push("/")}
                                className="w-full btn-gold py-4"
                            >
                                Rescan Now
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <MintScoreModal 
                isOpen={isMintModalOpen}
                onClose={() => setIsMintModalOpen(false)}
                analysis={analysis}
            />
        </div>
    );
}
