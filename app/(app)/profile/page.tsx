"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSubscribe } from "@/hooks/useSubscribe";
import { Navbar } from "@/components/ui/Navbar";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ProfilePage() {
    const { address, isConnected } = useAccount();
    const { isSubscribed, onChainScores } = useSubscribe();
    const [profile, setProfile] = useState<any>(null);
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isConnected && address) {
            fetchProfile();
        }
    }, [isConnected, address]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/profile?address=${address}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                setAnalyses(data.analyses || []);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-deep text-text">
            <Navbar />
            <div className="page-shell pt-32 sm:pt-40 px-6 sm:px-8 lg:px-12">
                <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10">
                    {!isConnected ? (
                        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-8 reveal">
                            <h1 className="font-serif text-4xl text-gold mb-6">Connect Your Wallet</h1>
                            <p className="text-soft text-sm max-w-md mx-auto mb-8">
                                Please connect your wallet to view your comprehensive beauty analysis history and on-chain verified scores.
                            </p>
                            <ConnectButton />
                        </div>
                    ) : (
                        <>
                            <div className="mb-16 reveal">
                                <p className="eyebrow mb-6">Account</p>
                                <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-light text-text mb-8">
                                    Your <em className="text-gold italic">Profile</em>
                                </h1>
                                
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="surface-card p-8 bg-surface/40 border border-gold/15 transition-all hover:bg-surface/60">
                                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-4">Wallet Address</p>
                                        <p className="font-mono text-gold text-lg truncate">{address}</p>
                                    </div>
                                    
                                    <div className="surface-card p-8 bg-surface/40 border border-gold/15 transition-all hover:bg-surface/60">
                                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-4">Onchain Access</p>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-gold animate-pulse' : 'bg-red-500'}`}></span>
                                            <p className="font-serif text-2xl text-text">
                                                {isSubscribed ? 'Active Onchain Access' : 'Not Subscribed'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-16 reveal">
                                <h2 className="font-serif text-3xl text-text mb-8">Scan History</h2>
                                {loading ? (
                                    <div className="text-center py-20">
                                        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto"></div>
                                    </div>
                                ) : analyses.length > 0 ? (
                                    <div className="grid gap-4">
                                        {analyses.map((analysis) => (
                                            <div 
                                                key={analysis.id} 
                                                className="surface-card p-6 flex flex-col sm:flex-row justify-between items-center gap-6 hover:border-gold/30 transition-all cursor-pointer bg-surface/30" 
                                                onClick={() => window.location.href = `/analyse/${analysis.id}`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-[10px] tracking-[0.1em] text-muted uppercase">Score</p>
                                                        <p className="font-serif text-3xl text-gold">{analysis.overall_score.toFixed(1)}</p>
                                                    </div>
                                                    <div className="w-px h-10 bg-white/5"></div>
                                                    <div>
                                                        <p className="text-sm text-text font-light">{analysis.category}</p>
                                                        <p className="text-[10px] text-muted uppercase tracking-wider">
                                                            {new Date(analysis.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button className="text-[10px] tracking-[0.2em] uppercase text-gold hover:text-white transition-colors">
                                                    View Report ⟶
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="surface-card p-12 text-center bg-surface/20 border-dashed border-gold/10">
                                        <p className="text-muted text-sm italic">No analyses found yet.</p>
                                    </div>
                                )}
                            </div>

                            {onChainScores && onChainScores.length > 0 && (
                                <div className="mb-16 reveal">
                                    <h2 className="font-serif text-3xl text-text mb-8">On-Chain Verified History</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {onChainScores.map((tokenId: bigint, idx) => (
                                            <div key={idx} className="surface-card p-6 text-center border-gold/20 bg-gold/5 flex flex-col justify-center gap-2">
                                                <p className="text-[8px] tracking-[0.2em] text-muted uppercase">On-Chain</p>
                                                <p className="font-serif text-3xl text-gold">#{tokenId.toString()}</p>
                                                <p className="text-[9px] text-muted/60">Minted token</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile?.best_score && (
                                <div className="surface-card p-8 border-gold/30 bg-gold/10 max-w-sm reveal">
                                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-4 opacity-70">Personal Best</p>
                                    <p className="font-serif text-6xl text-gold font-light leading-none">{profile.best_score.toFixed(1)}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
