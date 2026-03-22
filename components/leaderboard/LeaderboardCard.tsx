import { LeaderboardEntry } from "@/types/leaderboard";

interface LeaderboardCardProps {
    entry: LeaderboardEntry;
    showCountry?: boolean;
}

export function LeaderboardCard({
    entry,
    showCountry = false,
}: LeaderboardCardProps) {
    const getRankStyle = (rank: number) => {
        if (rank === 1) return "border-gold/30 bg-gold/5";
        if (rank === 2) return "border-white/10 bg-white/5";
        if (rank === 3) return "border-white/10 bg-white/5";
        return "border-white/5 bg-transparent";
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    };

    return (
        <div
            className={`group border transition-all duration-700 ease-out ${
                entry.rank === 1 
                ? "border-gold/30 bg-gold-glow/10 p-10 sm:p-12 scale-[1.02] shadow-premium z-10" 
                : "border-white/5 bg-deep p-8 sm:p-10 hover:border-gold/30 hover:bg-white/2"
            }`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 sm:gap-16">
                <div className="flex items-center gap-8 sm:gap-12 min-w-0">
                    <div className={`shrink-0 flex items-center justify-center font-serif text-gold leading-none tracking-[0.1em] ${
                        entry.rank <= 3 ? "text-5xl lg:text-6xl" : "text-2xl opacity-40"
                    }`}>
                        {entry.rank.toString().padStart(2, '0')}
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-6 mb-4 flex-wrap">
                            <h3 className={`font-serif tracking-wide text-text truncate font-light ${
                                entry.rank === 1 ? "text-3xl lg:text-4xl" : "text-2xl"
                            }`}>
                                {entry.displayName}
                            </h3>
                            {showCountry && entry.countryCode && (
                                <span className="text-[10px] tracking-[0.4em] text-muted uppercase opacity-40 border-l border-white/10 pl-6">
                                    {entry.countryCode}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-baseline gap-8 sm:gap-12">
                            <div className="flex items-baseline gap-4">
                                <span className={`font-serif text-gold leading-none font-light ${
                                    entry.rank === 1 ? "text-6xl lg:text-7xl" : "text-4xl lg:text-5xl"
                                }`}>
                                    {entry.overallScore.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-muted tracking-[0.2em] uppercase font-light opacity-60">
                                    Score
                                </span>
                            </div>

                            <div className="hidden md:block w-[1px] h-6 bg-white/5"></div>

                            <span className="text-[10px] tracking-[0.3em] uppercase text-text/60 font-light">
                                {entry.category}
                            </span>

                            <span className="text-[10px] tracking-[0.3em] text-gold uppercase italic font-medium">
                                TOP {entry.percentile}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-[10px] tracking-[0.3em] text-muted uppercase opacity-40 sm:text-right shrink-0 font-light">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </div>
            </div>
        </div>
    );
}
