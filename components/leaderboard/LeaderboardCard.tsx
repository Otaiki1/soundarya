import { LeaderboardEntry } from "@/types/leaderboard";

interface LeaderboardCardProps {
    entry: LeaderboardEntry;
    showCountry?: boolean;
}

export function LeaderboardCard({
    entry,
    showCountry = false,
}: LeaderboardCardProps) {
    const shortWallet = entry.walletAddress
        ? `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`
        : null;
    const hasPercentile =
        typeof entry.percentile === "number" && entry.percentile > 0;
    const createdAt = new Date(entry.createdAt);
    const showDate = !Number.isNaN(createdAt.getTime());

    return (
        <div
            className={`group border transition-all duration-700 ease-out ${
                entry.rank === 1 
                ? "border-gold/40 bg-gold/5 p-12 sm:p-14 scale-[1.02] shadow-premium z-10" 
                : "border-gold/5 bg-deep/40 p-10 sm:p-12 hover:border-gold/25 hover:bg-gold/2"
            }`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 sm:gap-16">
                <div className="flex items-center gap-8 sm:gap-12 min-w-0">
                    <div className={`shrink-0 flex items-center justify-center font-serif text-gold-bright leading-none tracking-[0.05em] font-light ${
                        entry.rank <= 3 ? "text-6xl lg:text-7xl" : "text-3xl opacity-30"
                    }`}>
                        {entry.rank.toString().padStart(2, '0')}
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-6 mb-6 flex-wrap">
                            <h3 className={`font-serif tracking-wide text-text truncate font-light ${
                                entry.rank === 1 ? "text-4xl lg:text-5xl" : "text-3xl"
                            }`}>
                                {entry.displayName}
                            </h3>
                            {entry.minted && (
                                <span className="text-[10px] tracking-[0.28em] text-gold-bright uppercase border border-gold/20 bg-gold/5 px-3 py-2">
                                    Minted
                                </span>
                            )}
                            {showCountry && entry.countryCode && (
                                <span className="text-[10px] tracking-[0.4em] text-muted uppercase opacity-40 border-l border-white/10 pl-6">
                                    {entry.countryCode}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-baseline gap-10 sm:gap-14">
                            <div className="flex items-baseline gap-4">
                                <span className={`font-serif text-gold-bright leading-none font-light ${
                                    entry.rank === 1 ? "text-7xl lg:text-8xl" : "text-5xl lg:text-6xl"
                                }`}>
                                    {entry.overallScore.toFixed(1)}
                                </span>
                                <span className="text-[9px] text-muted tracking-[0.3em] uppercase font-light opacity-60">
                                    Rating
                                </span>
                            </div>

                            <div className="hidden md:block w-[1px] h-8 bg-gold/10"></div>

                            {entry.category && (
                                <span className="text-[9px] tracking-[0.4em] uppercase text-text/60 font-medium">
                                    {entry.category}
                                </span>
                            )}

                            {hasPercentile ? (
                                <span className="text-[9px] tracking-[0.4em] text-gold-bright uppercase italic font-semibold">
                                    TOP {entry.percentile}%
                                </span>
                            ) : (
                                <span className="text-[9px] tracking-[0.4em] text-gold-bright uppercase italic font-semibold">
                                    Base wallet
                                </span>
                            )}
                        </div>

                        {shortWallet && (
                            <p className="mt-5 text-[10px] tracking-[0.3em] uppercase text-muted opacity-50">
                                {shortWallet}
                            </p>
                        )}
                    </div>
                </div>

                {showDate && (
                    <div className="text-[10px] tracking-[0.3em] text-muted uppercase opacity-40 sm:text-right shrink-0 font-light">
                        {createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
