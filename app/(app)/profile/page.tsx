"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { BeautyAssistant } from "@/components/assistant/BeautyAssistant";
import { ScoreHistoryGraph } from "@/components/profile/ScoreHistoryGraph";
import { ScanHistory } from "@/components/profile/ScanHistory";
import { WalletSection } from "@/components/profile/WalletSection";
import { UsernameForm } from "@/components/profile/UsernameForm";
import { Navbar } from "@/components/ui/Navbar";
import { useScoreHistory } from "@/hooks/useScoreHistory";
import { useSubscribe } from "@/hooks/useSubscribe";
import { SOUNDARYA_SCORE_ABI, SOUNDARYA_SCORE_ADDRESS } from "@/lib/contracts";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data, isLoading } = useScoreHistory();
  const { onChainScores } = useSubscribe();
  const [profile, setProfile] = useState<any>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const { data: canRescan } = useReadContract({
    address: SOUNDARYA_SCORE_ADDRESS,
    abi: SOUNDARYA_SCORE_ABI,
    functionName: "canRescan",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: lastScanTime } = useReadContract({
    address: SOUNDARYA_SCORE_ADDRESS,
    abi: SOUNDARYA_SCORE_ABI,
    functionName: "lastScanTime",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: rescanCredits } = useReadContract({
    address: SOUNDARYA_SCORE_ADDRESS,
    abi: SOUNDARYA_SCORE_ABI,
    functionName: "rescanCredits",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (!address) return;
    void fetch(`/api/profile?address=${address}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload) setProfile(payload.profile);
      })
      .catch(() => {});
  }, [address]);

  const analyses = data?.analyses ?? [];
  const bestAnalysisId = analyses[0]?.id;

  const rescanText = useMemo(() => {
    if (canRescan) return "Rescan Ready";
    if (!lastScanTime) return "No scan onchain yet";

    const nextTime = Number(lastScanTime) * 1000 + 7 * 24 * 60 * 60 * 1000;
    const remaining = Math.max(0, nextTime - Date.now());
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `Rescan available in ${days}d ${hours}h`;
  }, [canRescan, lastScanTime]);

  return (
    <div className="min-h-screen bg-deep text-text">
      <Navbar />
      <div className="page-shell pt-32 sm:pt-40 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-10">
          {!isConnected ? (
            <div className="border border-gold/20 bg-gold/5 p-10 text-center">
              <h1 className="font-serif text-4xl text-gold">Connect your wallet</h1>
              <p className="mx-auto mt-4 max-w-md text-sm text-soft">
                Your profile brings together wallet-linked scans, unlocked reports,
                minted NFTs, username, and rescan state.
              </p>
              <div className="mt-8 flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="border border-white/8 bg-white/2 p-6 sm:p-8">
                  <p className="eyebrow mb-5">Profile</p>
                  <h1 className="font-serif text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.95]">
                    Your personal intelligence dashboard
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-soft">
                    Review your score history, link prior scans, mint verified records, and track how your face changes over time.
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="border border-gold/20 bg-gold/5 p-5">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Wallet</p>
                    <p className="mt-2 font-mono text-sm text-gold">
                      {address}
                    </p>
                  </div>
                  <div className="border border-white/8 bg-white/2 p-5">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Rescan status</p>
                    <p className="mt-2 text-lg text-text">{rescanText}</p>
                    <p className="mt-2 text-xs text-muted">
                      Elite credits: {Number(rescanCredits ?? 0)}
                    </p>
                  </div>
                </div>
              </section>

              <ScoreHistoryGraph analyses={analyses} />

              <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <ScanHistory analyses={analyses} />
                <div className="space-y-6">
                  <UsernameForm currentUsername={profile?.username} />
                  <div className="border border-white/8 bg-white/2 p-6">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Assistant</p>
                    <p className="mt-3 text-sm leading-relaxed text-soft">
                      Premium and Elite users can ask the Beauty Assistant about priorities, tradeoffs, and styling strategy.
                    </p>
                    <button
                      onClick={() => setAssistantOpen(true)}
                      disabled={!bestAnalysisId}
                      className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Open Assistant
                    </button>
                  </div>
                </div>
              </section>

              <WalletSection mintedTokenIds={onChainScores} analyses={analyses} />

              <section className="grid gap-4 sm:grid-cols-3">
                <div className="border border-white/8 bg-white/2 p-5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Best Score</p>
                  <p className="mt-2 font-serif text-5xl text-gold">
                    {(data?.bestScore ?? 0).toFixed(1)}
                  </p>
                </div>
                <div className="border border-white/8 bg-white/2 p-5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Total Scans</p>
                  <p className="mt-2 font-serif text-5xl text-text">
                    {data?.totalScans ?? 0}
                  </p>
                </div>
                <div className="border border-white/8 bg-white/2 p-5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Improvement</p>
                  <p className="mt-2 font-serif text-5xl text-gold">
                    {(data?.improvement ?? 0) >= 0 ? "+" : ""}
                    {(data?.improvement ?? 0).toFixed(1)}
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
      <BeautyAssistant
        analysisId={bestAnalysisId}
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}
