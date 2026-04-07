"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { notFound } from "next/navigation";
import { DropZone } from "@/components/upload/DropZone";
import { ResultModal } from "@/components/upload/ResultModal";
import { useToast, ToastContainer } from "@/hooks/useToast";
import type { AnalysisPublic } from "@/types/analysis";
import { getOrCreateSessionId } from "@/lib/session";

interface PageParams {
    params: Promise<{ token: string }>;
}

interface ChallengeData {
    challengerId: string;
    score: number;
    category: string;
    countryCode: string;
    symmetry: number;
    goldenRatio: number;
    boneStructure: number;
    displayName: string;
}

export default function ChallengePage({ params }: PageParams) {
    const { token } = use(params);

    const [challengeData, setChallengeData] = useState<ChallengeData | null>(
        null,
    );
    const [userAnalysis, setUserAnalysis] = useState<AnalysisPublic | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [creatingChallenge, setCreatingChallenge] = useState(false);
    const { toasts, addToast, removeToast } = useToast();
    const uploadRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const response = await fetch(`/api/challenge/${token}`);
                if (!response.ok) throw new Error("Challenge not found");
                const data = await response.json();
                setChallengeData(data);
            } catch (error) {
                console.error("Failed to load challenge:", error);
                notFound();
            } finally {
                setLoading(false);
            }
        };

        fetchChallenge();
    }, [token]);

    const handleAnalysisComplete = (analysis: AnalysisPublic) => {
        setUserAnalysis(analysis);
        setShowResult(true);
    };

    const handleCreateChallenge = async () => {
        if (!userAnalysis) return;

        setCreatingChallenge(true);
        try {
            const response = await fetch("/api/challenge/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    analysisId: userAnalysis.id,
                    sessionId: getOrCreateSessionId(),
                }),
            });

            if (!response.ok) throw new Error("Failed to create challenge");

            const { challengeUrl } = await response.json();

            // Copy to clipboard
            await navigator.clipboard.writeText(challengeUrl);
            addToast("Challenge link copied!", "success", 2500);
        } catch (error) {
            console.error("Failed to create challenge:", error);
            addToast("Failed to create challenge", "error");
        } finally {
            setCreatingChallenge(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 mx-auto border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                    <p className="text-muted text-sm">Loading challenge...</p>
                </div>
            </div>
        );
    }

    if (!challengeData) {
        notFound();
    }

    const userWon =
        userAnalysis && userAnalysis.overallScore > challengeData.score;
    const countryFlag =
        challengeData.countryCode === "US"
            ? "🇺🇸"
            : challengeData.countryCode === "GB"
              ? "🇬🇧"
              : "🌍";

    return (
        <div className="min-h-screen bg-gradient-to-b from-rgba(201,169,106,0.05) to-transparent">
            {/* Challenge Hero */}
            <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
                <div className="text-center space-y-6 mb-12">
                    <p className="eyebrow text-gold">You've been challenged</p>

                    {/* Challenger Score Card */}
                    <div className="max-w-md mx-auto border border-gold/50 bg-surface p-12 rounded-sm space-y-6">
                        <div>
                            <p className="text-muted text-xs mb-2 tracking-wide uppercase">
                                Anonymous Challenger
                            </p>
                            <p className="text-xs text-gold/70">
                                {challengeData.displayName}
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="font-serif text-7xl text-gold font-light mb-2">
                                {challengeData.score.toFixed(1)}
                            </div>
                            <p className="text-sm text-muted mb-3">
                                {challengeData.category}
                            </p>
                            <p className="text-xs text-soft">
                                Top 10% globally
                            </p>
                            {countryFlag && (
                                <p className="text-2xl mt-2">{countryFlag}</p>
                            )}
                        </div>

                        <div className="border-t border-gold/20 pt-4 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted">Symmetry:</span>
                                <span className="text-gold">
                                    {challengeData.symmetry.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">
                                    Golden Ratio:
                                </span>
                                <span className="text-gold">
                                    {challengeData.goldenRatio.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">
                                    Bone Structure:
                                </span>
                                <span className="text-gold">
                                    {challengeData.boneStructure.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* VS */}
                    {!userAnalysis && (
                        <p className="font-serif text-4xl text-muted/50 my-6">
                            VS
                        </p>
                    )}

                    {/* Challenge CTA */}
                    {!userAnalysis && (
                        <div className="space-y-6">
                            <div>
                                <p className="font-serif text-4xl text-text mb-3">
                                    Can you score higher?
                                </p>
                                <p className="text-muted text-sm leading-relaxed max-w-md mx-auto">
                                    Upload your photo and find out if you rank
                                    above them. Takes 30 seconds. No account
                                    required.
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    uploadRef.current?.scrollIntoView({
                                        behavior: "smooth",
                                    })
                                }
                                className="max-w-sm mx-auto w-full bg-gold text-surface font-serif py-4 px-6 hover:bg-gold/90 transition-all rounded-sm"
                            >
                                Accept the Challenge →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Zone */}
            {!userAnalysis && (
                <div ref={uploadRef} className="px-4 py-20">
                    <div className="max-w-2xl mx-auto">
                        <DropZone onAnalysisComplete={handleAnalysisComplete} />
                    </div>
                </div>
            )}

            {/* Result Comparison */}
            {showResult && userAnalysis && (
                <div className="px-4 py-20">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Scores Comparison */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Challenger */}
                            <div className="border border-gold/20 bg-surface p-8 rounded-sm text-center space-y-4">
                                <p className="text-xs text-muted uppercase tracking-wide">
                                    Challenger
                                </p>
                                <div className="font-serif text-6xl text-gold">
                                    {challengeData.score.toFixed(1)}
                                </div>
                                <p className="text-sm text-muted">
                                    {challengeData.category}
                                </p>
                            </div>

                            {/* User */}
                            <div
                                className={`border rounded-sm p-8 text-center space-y-4 ${userWon ? "border-gold/50 bg-gold/5" : "border-gold/20 bg-surface"}`}
                            >
                                <p
                                    className={`text-xs  uppercase tracking-wide ${userWon ? "text-gold" : "text-muted"}`}
                                >
                                    You
                                </p>
                                <div
                                    className={`font-serif text-6xl ${userWon ? "text-gold" : "text-gold/70"}`}
                                >
                                    {userAnalysis.overallScore.toFixed(1)}
                                </div>
                                <p className="text-sm text-muted">
                                    {userAnalysis.category}
                                </p>
                            </div>
                        </div>

                        {/* Result Badge */}
                        <div className="text-center">
                            {userWon ? (
                                <p className="font-serif text-4xl text-gold">
                                    YOU WIN! 🎉
                                </p>
                            ) : (
                                <p className="font-serif text-2xl text-muted">
                                    So close! 💪
                                </p>
                            )}
                        </div>

                        {/* Create Challenge Button */}
                        <div className="text-center">
                            <button
                                onClick={handleCreateChallenge}
                                disabled={creatingChallenge}
                                className="bg-gold text-surface font-serif py-3 px-8 hover:bg-gold/90 disabled:opacity-50 transition-all rounded-sm"
                            >
                                {creatingChallenge
                                    ? "Creating..."
                                    : "Create Your Challenge"}
                            </button>
                            <p className="text-xs text-muted mt-3">
                                Share your score and challenge your friends
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {userAnalysis ? (
                <ResultModal
                    isOpen={showResult}
                    result={userAnalysis}
                    onClose={() => {
                        setShowResult(false);
                        setUserAnalysis(null);
                    }}
                    onViewFullReport={() => {
                        setShowResult(false);
                    }}
                />
            ) : null}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
