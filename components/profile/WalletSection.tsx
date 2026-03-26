"use client";

import { useState } from "react";
import { useMintScore } from "@/hooks/useMintScore";

interface WalletSectionProps {
  mintedTokenIds: bigint[];
  analyses: Array<{ id: string; overall_score: number; created_at: string; unlock_tier?: number }>;
}

export function WalletSection({ mintedTokenIds, analyses }: WalletSectionProps) {
  const { mint, isLoading } = useMintScore();
  const [pendingAnalysisId, setPendingAnalysisId] = useState<string | null>(null);

  const minted = mintedTokenIds.map((tokenId) => tokenId.toString());
  const mintableAnalyses = analyses.filter((analysis) => (analysis.unlock_tier ?? 0) > 0);

  const handleMint = async (analysisId: string) => {
    setPendingAnalysisId(analysisId);
    await mint(analysisId);
    setPendingAnalysisId(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="border border-white/8 bg-white/2 p-6">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
          Minted NFTs
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {minted.length ? (
            minted.map((tokenId) => (
              <a
                key={tokenId}
                href={`https://basescan.org/token/${process.env.NEXT_PUBLIC_SCORE_NFT_ADDRESS}?a=${tokenId}`}
                target="_blank"
                rel="noreferrer"
                className="border border-gold/20 bg-gold/5 p-5 transition-colors hover:border-gold/40"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  Token
                </p>
                <p className="mt-2 font-serif text-4xl text-gold">#{tokenId}</p>
                <p className="mt-4 text-xs text-soft">View on Basescan</p>
              </a>
            ))
          ) : (
            <p className="text-sm text-muted">No minted scores yet.</p>
          )}
        </div>
      </div>

      <div className="border border-white/8 bg-white/2 p-6">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
          Mint eligible reports
        </p>
        <div className="mt-5 space-y-4">
          {mintableAnalyses.slice(0, 4).map((analysis) => (
            <div key={analysis.id} className="border border-white/8 p-4">
              <p className="font-serif text-3xl text-text">
                {Number(analysis.overall_score).toFixed(1)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {new Date(analysis.created_at).toLocaleDateString()}
              </p>
              <button
                onClick={() => handleMint(analysis.id)}
                disabled={isLoading}
                className="mt-4 border border-gold/25 px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingAnalysisId === analysis.id && isLoading ? "Minting..." : "Mint"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
