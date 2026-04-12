"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavbarConnectButton = dynamic(
    () =>
        import("@/components/web3/NavbarConnectButton").then((m) => ({
            default: m.NavbarConnectButton,
        })),
    {
        ssr: false,
        loading: () => (
            <div
                className="h-10 min-w-[148px] animate-pulse rounded-sm border border-gold/15 bg-white/[0.04]"
                aria-hidden
            />
        ),
    },
);

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
                    <NavbarConnectButton />
                </div>
            </div>
        </nav>
    );
}
