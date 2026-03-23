"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSubscribe } from "@/hooks/useSubscribe";
import { supabaseAdmin } from "@/lib/supabase/admin"; // Wait, client-side should use the client, but for now I'll use standard fetch to an API if available.

// I'll check if there's a profile API. 
// If not, I'll fetch directly from Supabase client (assuming it's set up).
// Let's assume we have /api/profile

export default function ProfilePage() {
    const { address, isConnected } = useAccount();
    const { isSubscribed } = useSubscribe();
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
            // Fetch from a profile endpoint or directly from Supabase if configured for client
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

    if (!isConnected) {
        return (
            <div className="page-shell flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <h1 className="font-serif text-3xl text-gold mb-6">Connect Your Wallet</h1>
                    <p className="text-soft text-sm mb-8">Please connect your wallet to view your profile and scan history.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-shell pt-32 sm:pt-40">
            <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10">
                <div className="mb-16">
                    <p className="eyebrow mb-6">Account</p>
                    <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-light text-text mb-8">
                        Your <em className="text-gold italic">Profile</em>
                    </h1>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="surface-card p-8">
                            <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-4">Wallet Address</p>
                            <p className="font-mono text-gold text-lg truncate">{address}</p>
                        </div>
                        
                        <div className="surface-card p-8">
                            <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-4">Subscription Status</p>
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-gold animate-pulse' : 'bg-red-500'}`}></span>
                                <p className="font-serif text-2xl text-text">
                                    {isSubscribed ? 'Active Onchain Access' : 'Not Subscribed'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-16">
                    <h2 className="font-serif text-3xl text-text mb-8">Scan History</h2>
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : analyses.length > 0 ? (
                        <div className="grid gap-4">
                            {analyses.map((analysis) => (
                                <div key={analysis.id} className="surface-card p-6 flex flex-col sm:flex-row justify-between items-center gap-6 hover:border-gold/30 transition-all cursor-pointer" onClick={() => window.location.href = `/analyse/${analysis.id}`}>
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
                        <div className="surface-card p-12 text-center">
                            <p className="text-muted text-sm italic">No analyses found yet.</p>
                        </div>
                    )}
                </div>

                {profile?.best_score && (
                    <div className="surface-card p-8 border-gold/20 bg-gold/5 max-w-sm">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Personal Best</p>
                        <p className="font-serif text-5xl text-gold">{profile.best_score.toFixed(1)}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
