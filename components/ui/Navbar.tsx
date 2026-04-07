"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
    const pathname = usePathname();

    const scrollToSection = (id: string) => {
        if (pathname !== "/") {
            window.location.href = `/#${id}`;
            return;
        }
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-gold/10 bg-deep/82 backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
                <Link href="/" className="leading-none transition-opacity hover:opacity-85">
                    <p className="font-serif text-[1.9rem] font-light tracking-[0.04em] text-gold-bright">
                        Uzoza
                    </p>
                    <p className="mt-1.5 text-[0.58rem] uppercase tracking-[0.38em] text-soft">
                        सौन्दर्य · Intelligence
                    </p>
                </Link>

                <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
                    <Link
                        href="/leaderboard"
                        className={`text-[0.68rem] uppercase tracking-[0.28em] transition-colors ${
                            pathname === "/leaderboard"
                                ? "text-gold-bright"
                                : "text-soft/60 hover:text-gold-bright"
                        }`}
                    >
                        Rankings
                    </Link>
                    <Link
                        href="/profile"
                        className={`text-[0.68rem] uppercase tracking-[0.28em] transition-colors ${
                            pathname === "/profile"
                                ? "text-gold-bright"
                                : "text-soft/60 hover:text-gold-bright"
                        }`}
                    >
                        History
                    </Link>
                    <button
                        onClick={() => scrollToSection("process")}
                        className="text-[0.68rem] uppercase tracking-[0.28em] text-soft/60 transition-colors hover:text-gold-bright"
                    >
                        How It Works
                    </button>
                    <button
                        onClick={() => scrollToSection("plans")}
                        className="text-[0.68rem] uppercase tracking-[0.28em] text-soft/60 transition-colors hover:text-gold-bright"
                    >
                        Access Plans
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <ConnectButton
                        showBalance={false}
                        chainStatus="none"
                        accountStatus="address"
                    />
                </div>
            </div>
        </nav>
    );
}
