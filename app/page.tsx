"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Navbar } from "@/components/ui/Navbar";
import { DowntimeModal } from "@/components/ui/DowntimeModal";
import { AnalysisModal } from "@/components/upload/AnalysisModal";
import { storeScanRecord } from "@/lib/scans";
import {
    SOUNDARYA_SCORE_ABI,
    SOUNDARYA_SCORE_ADDRESS,
} from "@/lib/contracts";
import { getOrCreateSessionId } from "@/lib/session";
import type { AnalysisPublic } from "@/types/analysis";

const stats = [
    { value: "68", label: "Facial landmarks mapped per portrait" },
    { value: "7", label: "Scientific dimensions scored" },
    { value: "< 60s", label: "From upload to full reading" },
    { value: "Base", label: "Network — your score, onchain" },
];

const processSteps = [
    {
        number: "01",
        label: "Natural light · Front-facing · No filters",
        title: "Frame your portrait",
        body: "One clear photograph is all Uzoza needs. No studio setup, no specialist equipment. Natural light, calm expression, facing the camera directly. The cleaner the photo, the more precise the reading.",
    },
    {
        number: "02",
        label: "AI scoring · 9 dimensions · Proportionality",
        title: "The analysis runs",
        body: "Uzoza maps 68 facial landmarks and scores nine distinct dimensions — symmetry, harmony, proportionality, averageness, bone structure, skin quality, dimorphism, neoteny, and adiposity — against the established science of facial attractiveness. The result takes under a minute.",
    },
    {
        number: "03",
        label: "Score · Percentile · Permanent proof",
        title: "You receive your reading — and can own it forever",
        body: "Your score, percentile rank, and full dimensional breakdown are ready immediately. With Premium, you unlock 20 personalised improvement observations. And with a single transaction on Base, your score becomes an immutable onchain credential — proof that is yours, forever.",
    },
];

const dimensions = [
    {
        title: "Facial Symmetry",
        body: "The bilateral balance of your features — the dimension most consistently correlated with perceived attractiveness across cultures and studies.",
    },
    {
        title: "Golden Ratio",
        body: "How closely your facial proportions adhere to the 1.618 ratio across your thirds, nose width, eye spacing, and lip-to-chin distance.",
    },
    {
        title: "Bone Structure",
        body: "Jawline definition, cheekbone prominence, brow ridge, chin projection. The architecture beneath the surface that no skincare routine changes.",
    },
    {
        title: "Feature Harmony",
        body: "How well your eyes, nose, lips, and jaw function as a unified aesthetic system — not individual parts, but a whole.",
    },
    {
        title: "Skin Quality",
        body: "Tone evenness, texture, and clarity — the surface signals visible in a well-framed portrait.",
    },
    {
        title: "Sexual Dimorphism",
        body: "The strength of masculine or feminine feature markers, calibrated specifically to your face type.",
    },
    {
        title: "Averageness Index",
        body: "A counterintuitive but well-established signal: closeness to population-averaged facial geometry correlates strongly with attractiveness.",
    },
];

const onchainBenefits = [
    {
        title: "✦ Immutable proof",
        body: "Your score as you earned it. Written to Base at the moment of minting. Permanent and unalterable.",
    },
    {
        title: "✦ Travels with your wallet",
        body: "Display it on any Web3 platform — Farcaster, OpenSea, any dApp that reads wallet contents. No integration needed.",
    },
    {
        title: "✦ Compete with real credentials",
        body: "The Uzoza leaderboard only accepts minted scores. Your NFT is your entry ticket — and the proof that your ranking is legitimate.",
    },
];

const leaderboardRows = [
    "#1 · 9.2 · Top 1% · 🇧🇷 · ✦ Minted",
    "#2 · 9.0 · Top 2% · 🇰🇷 · ✦ Minted",
    "#3 · 8.8 · Top 4% · 🇳🇬 · ✦ Minted",
];

const plans = [
    {
        name: "Essential",
        label: "A first, honest look",
        price: "Free",
        description:
            "Your entry point. See where you actually stand before deciding how much depth you want.",
        features: [
            "Overall harmony score (1.0–10.0)",
            "Global percentile ranking",
            "Symmetry snapshot",
            "Top 3 visible strengths",
            "1 free improvement observation",
        ],
        cta: "Start here — no wallet required",
        footnote:
            "3 free analyses per calendar month (UTC) · Same limit for this browser or your connected wallet · Photo deleted immediately",
    },
    {
        name: "Premium",
        label: "The full reading",
        price: "Paid in ETH on Base",
        description:
            "The complete picture. Every dimension explained, every weakness identified, every observation made actionable. This is the report worth owning.",
        features: [
            "Full 9-dimension breakdown",
            "Detailed strengths and weak points",
            "20 personalised improvement observations",
            "Skincare and grooming guidance",
            "Style notes calibrated to your face shape",
            "Downloadable report",
            "Rescan eligibility after 7 days",
        ],
        cta: "Unlock Premium",
        footnote: "Contract price on Base · USD estimate from live ETH",
        featured: true,
    },
    {
        name: "Elite",
        label: "For serious optimisation",
        price: "Paid in ETH on Base",
        description:
            "Everything in Premium, plus deeper personalisation, priority processing, and three rescan credits included.",
        features: [
            "Everything in Premium",
            "3 rescan credits included",
            "Priority analysis processing",
            "Extended style and grooming guide",
            "Deeper facial structure analysis",
            "Personalised improvement roadmap",
        ],
        cta: "Unlock Elite",
    },
];

const resultMetrics = [
    { label: "Symmetry", value: 97 },
    { label: "Proportion", value: 82 },
    { label: "Harmony", value: 91 },
    { label: "Structure", value: 72 },
    { label: "Skin", value: 85 },
    { label: "Dimorphism", value: 78 },
];

const heroImages = [
    {
        src: "/Nigerian_man_with_golden_ratio_analysis_lines.png",
        alt: "Nigerian man portrait with golden ratio analysis lines",
    },
    {
        src: "/Brazilian_woman_with_symmetry_nodes.png",
        alt: "Brazilian woman portrait with symmetry nodes",
    },
];

function SectionHeader({
    label,
    title,
    body,
}: {
    label: string;
    title: string;
    body?: string;
}) {
    return (
        <div className="max-w-3xl">
            <p className="eyebrow mb-5">{label}</p>
            <h2 className="font-serif text-[clamp(2.3rem,4.8vw,4.8rem)] font-light leading-[0.95] tracking-[-0.05em] text-text">
                {title}
            </h2>
            {body ? (
                <p className="mt-5 max-w-2xl text-[1rem] leading-8 text-soft">
                    {body}
                </p>
            ) : null}
        </div>
    );
}

export default function Home() {
    const { address } = useAccount();
    const { data: unlockPriceWei } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "unlockPrice",
    });
    const { data: premiumPriceWei } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "premiumPrice",
    });
    const { data: elitePriceWei } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "elitePrice",
    });
    const { data: mintPriceWei } = useReadContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "mintPrice",
    });

    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<AnalysisPublic | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [activeHeroImage, setActiveHeroImage] = useState(0);
    const [downtimeOpen, setDowntimeOpen] = useState(false);
    const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null);
    const [quotaNotice, setQuotaNotice] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const contractEthLabels = useMemo(() => {
        const asWei = (v: unknown): bigint | undefined =>
            typeof v === "bigint" ? v : undefined;
        const eth = (wei: bigint | undefined) =>
            typeof wei === "bigint" ? Number(formatEther(wei)).toFixed(4) : null;
        const usd = (wei: bigint | undefined) => {
            if (typeof wei !== "bigint" || ethPriceUsd == null) return null;
            return Math.round(Number(formatEther(wei)) * ethPriceUsd);
        };
        return {
            unlock: eth(asWei(unlockPriceWei)),
            premium: eth(asWei(premiumPriceWei)),
            elite: eth(asWei(elitePriceWei)),
            mint: eth(asWei(mintPriceWei)),
            unlockUsd: usd(asWei(unlockPriceWei)),
            premiumUsd: usd(asWei(premiumPriceWei)),
            eliteUsd: usd(asWei(elitePriceWei)),
            mintUsd: usd(asWei(mintPriceWei)),
        };
    }, [
        elitePriceWei,
        ethPriceUsd,
        mintPriceWei,
        premiumPriceWei,
        unlockPriceWei,
    ]);

    useEffect(() => {
        void fetch("/api/eth-price")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (typeof data?.priceUsd === "number") {
                    setEthPriceUsd(data.priceUsd);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveHeroImage((current) => (current + 1) % heroImages.length);
        }, 5500);

        return () => window.clearInterval(interval);
    }, []);

    const handleFile = async (file: File) => {
        if (!file || !file.type.startsWith("image/")) return;

        setUploadedFile(file);
        setIsUploading(true);
        setIsModalOpen(true);
        setResult(null);
        setQuotaNotice(null);

        try {
            const sessionId = getOrCreateSessionId();
            const formData = new FormData();
            formData.append("photo", file);
            formData.append("sessionId", sessionId);
            if (address) {
                formData.append("walletAddress", address);
            }

            const response = await fetch("/api/analyse", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                let message = "Analysis failed";
                let errorCode = "";
                try {
                    const errorData = await response.json();
                    if (typeof errorData?.error === "string") {
                        message = errorData.error;
                    }
                    if (typeof errorData?.code === "string") {
                        errorCode = errorData.code;
                    }
                } catch {
                    // Ignore JSON parse errors and keep the fallback message.
                }

                if (response.status === 429 || errorCode === "FREE_QUOTA_EXCEEDED") {
                    setIsModalOpen(false);
                    setUploadedFile(null);
                    setQuotaNotice(message);
                    return;
                }

                if (response.status === 503 || errorCode === "ORACLE_UNAVAILABLE") {
                    setIsModalOpen(false);
                    setUploadedFile(null);
                    setDowntimeOpen(true);
                    return;
                }

                throw new Error(message);
            }

            const data = await response.json();
            setResult(data);
            if (data?.id && data?.persisted !== false) {
                storeScanRecord(data.id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="min-h-screen bg-deep text-text">
            <Navbar />

            {quotaNotice ? (
                <div
                    role="alert"
                    className="fixed inset-x-0 top-20 z-40 mx-auto max-w-2xl border border-amber-400/35 bg-amber-950/90 px-5 py-4 text-center text-sm text-amber-100 shadow-lg backdrop-blur-md sm:top-24"
                >
                    {quotaNotice}
                    <button
                        type="button"
                        onClick={() => setQuotaNotice(null)}
                        className="ml-3 underline decoration-amber-400/50 hover:decoration-amber-200"
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            <main className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(201,169,110,0.08),transparent_22%),radial-gradient(circle_at_84%_14%,rgba(229,190,132,0.12),transparent_18%),radial-gradient(circle_at_72%_60%,rgba(188,137,76,0.08),transparent_24%)]" />
                </div>

                <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-6 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20 lg:px-12 lg:pt-36">
                    <div className="relative z-10 max-w-2xl">
                        <p className="eyebrow mb-7">
                            AI Analysis · Onchain Proof · Base Network
                        </p>
                        <h1 className="font-serif text-[clamp(3.2rem,7vw,6.9rem)] font-light leading-[0.9] tracking-[-0.06em] text-text">
                            See your face the way science does.
                            <span className="mt-2 block">
                                Clear scores, percentiles, and what to improve next.
                            </span>
                        </h1>
                        <p className="mt-6 font-serif text-[clamp(1.65rem,3vw,2.4rem)] italic leading-tight text-gold-bright">
                            Honest analysis first — optional proof on Base when you are ready.
                        </p>
                        <p className="mt-8 max-w-2xl text-[1.03rem] leading-8 text-soft">
                            Upload one portrait and get a structured reading across nine
                            dimensions — symmetry, harmony, proportionality, bone structure,
                            skin, and more — with a global percentile and strengths you can
                            act on. Your photo is deleted right after the run. When you want
                            permanence, mint your score as a credential on Base.
                        </p>

                        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={() => scrollToSection("upload")}
                                className="btn-gold-hero"
                            >
                                → Get your free analysis
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection("plans")}
                                className="btn-secondary-hero"
                            >
                                → Compare plans
                            </button>
                        </div>

                        <div className="mt-10 border-t border-gold/12 pt-6 text-[0.72rem] uppercase tracking-[0.2em] text-soft">
                            ✦ Results in under 60 seconds · ✦ 3 free analyses per month
                            (wallet or this browser) · ✦ Photo deleted after analysis · ✦ No
                            account required to start
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="absolute -inset-8 bg-[radial-gradient(circle,rgba(201,169,110,0.14),transparent_62%)] blur-3xl" />
                        <div className="relative overflow-hidden border border-gold/18 bg-[linear-gradient(180deg,rgba(24,18,13,0.92),rgba(13,10,7,0.84))] shadow-premium">
                            <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
                                <div className="relative min-h-[520px] border-b border-gold/10 md:border-b-0 md:border-r md:border-gold/10">
                                    {heroImages.map((image, index) => (
                                        <Image
                                            key={image.src}
                                            src={image.src}
                                            alt={image.alt}
                                            fill
                                            sizes="(min-width: 768px) 50vw, 100vw"
                                            priority={index === 0}
                                            className={`object-cover object-center transition-opacity duration-[1400ms] ${
                                                activeHeroImage === index
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            }`}
                                        />
                                    ))}
                                    <div className="absolute inset-x-5 bottom-5 flex gap-2">
                                        {heroImages.map((image, index) => (
                                            <button
                                                key={image.src}
                                                type="button"
                                                onClick={() => setActiveHeroImage(index)}
                                                className={`h-1.5 flex-1 transition-colors ${
                                                    activeHeroImage === index
                                                        ? "bg-gold-bright"
                                                        : "bg-white/20"
                                                }`}
                                                aria-label={`Show hero portrait ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between p-8">
                                    <div>
                                        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-gold">
                                            Sample result
                                        </p>
                                        <div className="mt-4 font-serif text-[5rem] font-light leading-none text-gold-bright">
                                            8.3
                                        </div>
                                        <p className="mt-3 text-[0.7rem] uppercase tracking-[0.3em] text-soft">
                                            Top 10 percentile globally
                                        </p>
                                        <div className="mt-5 inline-flex border border-gold/20 px-3 py-2 text-[0.66rem] uppercase tracking-[0.2em] text-gold-light">
                                            ✦ Minted on Base · Token #1,204
                                        </div>
                                    </div>

                                    <div className="mt-10 space-y-5">
                                        {[
                                            { label: "Symmetry", value: 97 },
                                            { label: "Proportion", value: 82 },
                                            { label: "Harmony", value: 91 },
                                            { label: "Structure", value: 72 },
                                        ].map((metric) => (
                                            <div key={metric.label} className="space-y-2">
                                                <div className="flex items-end justify-between text-[0.7rem] uppercase tracking-[0.24em] text-soft">
                                                    <span>{metric.label}</span>
                                                    <span className="font-serif text-[1rem] tracking-normal text-gold-light">
                                                        {metric.value}
                                                    </span>
                                                </div>
                                                <div className="h-px bg-white/8">
                                                    <div
                                                        className="h-px bg-gold-bright"
                                                        style={{ width: `${metric.value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <p className="mt-10 border-t border-gold/10 pt-6 font-serif text-[1rem] italic leading-7 text-soft">
                                        &quot;The first time I&apos;ve seen something tell
                                        me the honest truth about my face — and I
                                        can actually prove it&apos;s mine.&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-gold/10 bg-[linear-gradient(180deg,rgba(22,17,13,0.86),rgba(13,10,7,0.76))]">
                    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
                        {stats.map((item) => (
                            <div key={item.label} className="border-l border-gold/14 pl-5">
                                <p className="font-serif text-[2.9rem] font-light leading-none text-gold-bright">
                                    {item.value}
                                </p>
                                <p className="mt-3 max-w-[15rem] text-[0.76rem] uppercase tracking-[0.18em] text-soft">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-14 px-6 py-24 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12 lg:py-32">
                    <SectionHeader
                        label="Why Uzoza exists"
                        title="Everyone has an opinion about how you look. Nobody has ever given you the data."
                    />
                    <div className="space-y-7 text-[1rem] leading-8 text-soft">
                        <p>
                            Your friends flatter you. Dating apps give you swipe
                            counts but no explanation. Mirrors show you what you
                            already know. What nobody has ever handed you is the
                            objective, structured reading — the kind a trained
                            aesthetician would give, backed by measurement rather
                            than preference.
                        </p>
                        <p>
                            Uzoza does that. And then it goes one step
                            further: it lets you own the result.
                        </p>
                        <div className="border border-gold/14 bg-surface/36 p-7 font-serif text-[1.15rem] italic leading-8 text-gold-light">
                            When your score is minted on Base, it cannot be
                            changed, disputed, or taken away. It is a verifiable,
                            permanent record — a credential that travels with your
                            wallet everywhere.
                        </div>
                    </div>
                </section>

                <section
                    id="process"
                    className="border-y border-gold/10 bg-[linear-gradient(180deg,rgba(19,15,11,0.9),rgba(15,11,8,0.95))]"
                >
                    <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
                        <SectionHeader
                            label="The process"
                            title="Three steps from portrait to permanent record."
                        />
                        <div className="mt-14 grid gap-6">
                            {processSteps.map((step) => (
                                <article
                                    key={step.number}
                                    className="grid gap-6 border border-gold/12 bg-surface/40 p-8 sm:grid-cols-[88px_1fr]"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center border border-gold/18 font-serif text-[2rem] font-light text-gold-bright">
                                        {step.number}
                                    </div>
                                    <div>
                                        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-gold">
                                            {step.label}
                                        </p>
                                        <h3 className="mt-3 font-serif text-[2rem] font-light tracking-[-0.03em] text-text">
                                            {step.title}
                                        </h3>
                                        <p className="mt-4 max-w-4xl text-[0.98rem] leading-8 text-soft">
                                            {step.body}
                                        </p>
                                        {step.number === "02" ? (
                                            <div className="mt-8 overflow-hidden border border-gold/10 bg-deep/50">
                                                <div className="relative min-h-[320px]">
                                                    <Image
                                                        src="/South_Asian_woman_with_landmark_mesh_and_partial_score.png"
                                                        alt="South Asian woman with landmark mesh and partial score"
                                                        fill
                                                        sizes="(min-width: 1024px) 70vw, 100vw"
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
                    <SectionHeader
                        label="The science"
                        title="Seven dimensions. One honest number."
                        body="Uzoza doesn't guess. It measures."
                    />
                    <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {dimensions.map((dimension, index) => (
                            <article
                                key={dimension.title}
                                className={`border border-gold/12 bg-surface/38 p-7 ${
                                    index === 6 ? "xl:col-span-3" : ""
                                }`}
                            >
                                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-gold/68">
                                    Dimension {index + 1}
                                </p>
                                <h3 className="mt-3 font-serif text-[1.9rem] font-light text-text">
                                    {dimension.title}
                                </h3>
                                <p className="mt-4 text-[0.96rem] leading-8 text-soft">
                                    {dimension.body}
                                </p>
                            </article>
                        ))}
                    </div>
                    <p className="mt-10 max-w-4xl text-[0.98rem] leading-8 text-soft">
                        All seven feed a single overall score from 1.0 to 10.0,
                        placed against a global percentile. Most people land
                        between 5.0 and 7.0. A score above 8.0 is genuinely rare.
                    </p>
                </section>

                <section className="border-y border-gold/10 bg-[linear-gradient(180deg,rgba(23,17,13,0.9),rgba(13,10,7,0.88))]">
                    <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-32">
                        <div>
                            <SectionHeader
                                label="Onchain · Base network"
                                title="Your score should belong to you. Not to us. Not to a server. To your wallet."
                            />
                            <div className="mt-8 space-y-6 text-[1rem] leading-8 text-soft">
                                <p>
                                    Every analysis you run on Uzoza produces a
                                    result stored in our database. But a database
                                    can be deleted, altered, or taken offline. An
                                    onchain record cannot.
                                </p>
                                <p>
                                    When you mint your score on Base, every
                                    dimension — your symmetry reading, your bone
                                    structure score, your overall result, your
                                    percentile, the exact date — is written
                                    permanently to the chain. It lives in your
                                    wallet. It appears on OpenSea. It displays on
                                    your Farcaster profile. No one can alter it,
                                    dispute it, or take it away.
                                </p>
                                <p>
                                    This is what makes Uzoza different from
                                    every other analysis tool: the result is
                                    genuinely yours.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {onchainBenefits.map((benefit) => (
                                <article
                                    key={benefit.title}
                                    className="border border-gold/12 bg-surface/38 p-7"
                                >
                                    <h3 className="font-serif text-[1.7rem] font-light text-text">
                                        {benefit.title}
                                    </h3>
                                    <p className="mt-3 text-[0.96rem] leading-8 text-soft">
                                        {benefit.body}
                                    </p>
                                </article>
                            ))}
                            <div className="border border-gold/18 bg-gold/6 px-6 py-5 text-[0.76rem] uppercase tracking-[0.18em] text-gold-light">
                                Mint price:{" "}
                                {contractEthLabels.mint
                                    ? `${contractEthLabels.mint} ETH`
                                    : "… ETH"}{" "}
                                {contractEthLabels.mintUsd != null
                                    ? `(~$${contractEthLabels.mintUsd}) `
                                    : ""}
                                · Base · Score stored permanently onchain
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-16 px-6 py-24 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-12 lg:py-32">
                    <div>
                        <SectionHeader
                            label="Global rankings · Weekly epoch"
                            title="How do you rank against everyone else who has been honest about their face?"
                            body="The Uzoza leaderboard resets every seven days. To enter, you must have minted your score as an NFT — that is the proof that your result is real. Each epoch, the top ten scores hold their position. At the end of the week, rankings are recorded permanently and a new competition begins."
                        />
                        <button className="btn-secondary mt-10">
                            → View full leaderboard
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="overflow-hidden border border-gold/12 bg-surface/40">
                            <div className="relative min-h-[240px]">
                                <Image
                                    src="/Split_portrait_Black_man_and_European_woman.png"
                                    alt="Split portrait of a Black man and European woman with scores"
                                    fill
                                    sizes="(min-width: 1024px) 40vw, 100vw"
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div className="border border-gold/12 bg-surface/40 p-8">
                        <div className="grid grid-cols-[1.1fr_0.9fr_1fr_1fr_1fr] gap-3 border-b border-gold/10 pb-4 text-[0.68rem] uppercase tracking-[0.22em] text-soft">
                            <span>Rank</span>
                            <span>Score</span>
                            <span>Percentile</span>
                            <span>Country</span>
                            <span>Minted</span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {leaderboardRows.map((row) => (
                                <div
                                    key={row}
                                    className="border border-gold/8 bg-deep/50 px-4 py-4 font-serif text-[1.05rem] text-gold-light"
                                >
                                    {row}
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
                </section>

                <section className="border-y border-gold/10 bg-[linear-gradient(180deg,rgba(17,13,10,0.94),rgba(13,10,7,1))]">
                    <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-32">
                        <div>
                            <SectionHeader
                                label="Progress tracking"
                                title="Beauty is not static. Your score shouldn't be either."
                                body="Seven days after your last paid analysis, Uzoza unlocks a rescan. Same nine dimensions, same scientific framework, new portrait. If your score improves — better sleep, a new skincare routine, changed lighting, actual physical change — it shows up in the reading."
                            />
                            <p className="mt-6 max-w-xl text-[1rem] leading-8 text-soft">
                                Mint your new score. Submit it to the leaderboard.
                                Watch your position move.
                            </p>
                            <p className="mt-8 font-serif text-[1rem] italic leading-7 text-soft">
                                &quot;The rescan after six weeks of consistent sleep
                                and skincare hit different. +0.6 points. Minted
                                immediately.&quot;
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="overflow-hidden border border-gold/12 bg-surface/38">
                                <div className="relative min-h-[320px]">
                                    <Image
                                        src="/Arab_man_diptych_Week_1_vs_Week_6_with_delta_score.png"
                                        alt="Arab man diptych showing week 1 versus week 6 with delta score"
                                        fill
                                        sizes="(min-width: 1024px) 40vw, 100vw"
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            {[
                                "Day 0 · First analysis + mint",
                                "Day 7 · Rescan available",
                                "Day 7+ · New score · New NFT · Updated rank",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="border border-gold/12 bg-surface/38 px-6 py-5 font-serif text-[1.3rem] font-light text-gold-light"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="plans" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
                    <SectionHeader
                        label="Access"
                        title="Choose the depth of your reading."
                        body="All tiers use the same AI, the same nine dimensions, and the same scoring model. What changes is how deep the report goes — and what you can do with the result."
                    />

                    <div className="mt-14 grid gap-6 xl:grid-cols-3">
                        {plans.map((plan) => {
                            const isPremium = plan.name === "Premium";
                            const isElite = plan.name === "Elite";
                            const displayPrice =
                                isPremium && contractEthLabels.premium
                                    ? contractEthLabels.premiumUsd != null
                                        ? `~$${contractEthLabels.premiumUsd} · ~${contractEthLabels.premium} ETH`
                                        : `~${contractEthLabels.premium} ETH`
                                    : isElite && contractEthLabels.elite
                                      ? contractEthLabels.eliteUsd != null
                                          ? `~$${contractEthLabels.eliteUsd} · ~${contractEthLabels.elite} ETH`
                                          : `~${contractEthLabels.elite} ETH`
                                      : plan.price;
                            const displayCta =
                                isPremium && contractEthLabels.premium
                                    ? `Unlock Premium · ~${contractEthLabels.premium} ETH`
                                    : isElite && contractEthLabels.elite
                                      ? `Unlock Elite · ~${contractEthLabels.elite} ETH`
                                      : plan.cta;
                            return (
                            <article
                                key={plan.name}
                                className={`flex flex-col border p-8 ${
                                    plan.featured
                                        ? "border-gold/38 bg-gold/6 shadow-premium"
                                        : "border-gold/12 bg-surface/34"
                                }`}
                            >
                                <div className="border-b border-gold/10 pb-7">
                                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-gold/68">
                                        {plan.label}
                                    </p>
                                    <h3 className="mt-4 font-serif text-[2.5rem] font-light text-text">
                                        {plan.name}
                                    </h3>
                                    <p className="mt-5 font-serif text-[2.9rem] font-light leading-none text-gold-bright">
                                        {displayPrice}
                                    </p>
                                    {plan.featured ? (
                                        <div className="mt-4 inline-flex border border-gold/20 px-3 py-2 text-[0.66rem] uppercase tracking-[0.2em] text-gold-light">
                                            Recommended
                                        </div>
                                    ) : null}
                                </div>

                                <p className="mt-7 text-[0.96rem] leading-8 text-soft/80">
                                    {plan.description}
                                </p>

                                <ul className="mt-8 flex-1 space-y-4">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-3 text-[0.95rem] leading-7 text-soft/78"
                                        >
                                            <span className="mt-1 text-gold-bright">✦</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    type="button"
                                    onClick={() => scrollToSection("upload")}
                                    className={plan.featured ? "btn-gold mt-10" : "btn-secondary mt-10"}
                                >
                                    {displayCta}
                                </button>

                                {plan.footnote ? (
                                    <p className="mt-4 text-[0.72rem] uppercase tracking-[0.16em] text-soft/56">
                                        {plan.footnote}
                                    </p>
                                ) : null}
                            </article>
                            );
                        })}
                    </div>

                    <p className="mt-10 max-w-5xl text-[0.96rem] leading-8 text-soft">
                        All payments are processed in ETH on the Base network.
                        Dollar equivalents are calculated at current ETH price and
                        displayed at checkout. No subscription. No recurring
                        charge. Pay once, own your report.
                    </p>
                    <div className="mt-6 border border-gold/12 bg-surface/36 p-6 text-[0.92rem] leading-8 text-soft">
                        Want to own your result onchain?
                        <br />
                        Mint is typically{" "}
                        {contractEthLabels.mint
                            ? `${contractEthLabels.mint} ETH`
                            : "a small ETH amount"}{" "}
                        {contractEthLabels.mintUsd != null
                            ? `(~$${contractEthLabels.mintUsd} at today's ETH) `
                            : ""}
                        from the live contract on Base. Your score and dimensions are
                        written permanently. Required for leaderboard entry.
                    </div>
                </section>

                <section className="border-y border-gold/10 bg-[linear-gradient(180deg,rgba(23,17,13,0.92),rgba(12,10,8,0.96))]">
                    <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-32">
                        <div className="relative overflow-hidden border border-gold/12 bg-surface/40 p-6">
                            <div className="relative min-h-[360px] overflow-hidden border border-gold/10">
                                <Image
                                    src="/Korean_man_with_measurement_grid_and_score_readouts.png"
                                    alt="Korean man with measurement grid and score readouts"
                                    fill
                                    sizes="(min-width: 1024px) 45vw, 100vw"
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <div>
                            <SectionHeader
                                label="What the report looks like"
                                title="One focal score. Every dimension in full."
                                body="The Uzoza report is structured like a premium consultation — a single headline number, a percentile context, and then each dimension broken down with the clarity that makes the observation actually useful."
                            />

                            <div className="mt-10 border border-gold/12 bg-surface/38 p-8">
                                <div className="font-serif text-[5.5rem] font-light leading-none text-gold-bright">
                                    8.3
                                </div>
                                <p className="mt-3 text-[0.68rem] uppercase tracking-[0.32em] text-soft">
                                    Top 10 percentile globally
                                </p>
                                <p className="mt-3 text-[0.84rem] uppercase tracking-[0.18em] text-gold">
                                    Category: Very Attractive
                                </p>

                                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                    {resultMetrics.map((metric) => (
                                        <div key={metric.label} className="space-y-2">
                                            <div className="flex items-end justify-between">
                                                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-soft">
                                                    {metric.label}
                                                </p>
                                                <p className="font-serif text-[1.15rem] text-gold-light">
                                                    {metric.value}
                                                </p>
                                            </div>
                                            <div className="h-px bg-white/10">
                                                <div
                                                    className="h-px bg-gold-bright"
                                                    style={{ width: `${metric.value}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 border border-dashed border-gold/18 bg-deep/50 p-6">
                                    <p className="text-[0.92rem] leading-8 text-soft blur-[1.8px]">
                                        &quot;Strong bilateral symmetry positions you
                                        well above average on the dimension most
                                        correlated with attraction across cultures.
                                        The primary area for improvement is
                                        structural — the jawline lacks the
                                        definition that would elevate the bone
                                        structure score significantly. Three
                                        observations follow on what can
                                        realistically change this...&quot;
                                    </p>
                                </div>

                                <div className="mt-8 border-t border-gold/10 pt-6">
                                    <p className="text-[0.92rem] leading-8 text-soft">
                                        The full reading requires Premium. Unlock
                                        20 observations, all dimensions explained,
                                        and your improvement roadmap.
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-gold mt-6"
                                        onClick={() => scrollToSection("upload")}
                                    >
                                        → Unlock Premium
                                        {contractEthLabels.premium
                                            ? ` · ~${contractEthLabels.premium} ETH`
                                            : ""}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="upload"
                    className="mx-auto grid max-w-7xl gap-16 px-6 py-24 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-12 lg:py-32"
                >
                    <div>
                        <SectionHeader
                            label="Ready for your own reading?"
                            title="One portrait. The honest answer."
                            body="Upload a clean, front-facing portrait. No filters, no sunglasses, no heavy shadows. The analysis takes under a minute. Your photo is deleted the moment the reading is complete — it is never stored, shared, or used for anything beyond your result."
                        />
                        <div className="mt-10 space-y-4 text-[0.78rem] uppercase tracking-[0.18em] text-soft">
                            <p>→ Face the camera directly</p>
                            <p>→ Use neutral, natural light</p>
                            <p>→ No filters or heavy editing</p>
                            <p>→ Avoid sunglasses or hair covering the face</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative overflow-hidden border border-dashed border-gold/28 bg-[linear-gradient(180deg,rgba(28,21,16,0.92),rgba(18,13,10,0.92))] px-8 py-16 transition-all duration-300 hover:border-gold/50 hover:bg-[linear-gradient(180deg,rgba(34,26,20,0.96),rgba(19,14,10,0.96))]"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) {
                                        handleFile(file);
                                    }
                                }}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />

                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,190,132,0.12),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                            <div className="relative z-10 text-center">
                                <p className="eyebrow mb-5">Drop your portrait here</p>
                                <h3 className="font-serif text-[clamp(2.2rem,4vw,3.4rem)] font-light leading-none text-text">
                                    Drop your portrait here
                                </h3>
                                <p className="mt-4 text-[0.82rem] uppercase tracking-[0.18em] text-soft/62">
                                    or click to upload · JPG · PNG · WEBP · Max
                                    10MB
                                </p>
                            </div>
                        </div>

                        <p className="text-[0.84rem] leading-7 text-soft/72">
                            Your photo is deleted immediately after analysis. It
                            is never stored on our servers.
                        </p>

                        <div className="border border-gold/12 bg-surface/34 p-6">
                            <p className="font-serif text-[1.4rem] font-light text-gold-light">
                                Your score is ready. Want to own it permanently?
                            </p>
                            <p className="mt-3 text-[0.92rem] leading-8 text-soft/78">
                                Mint to Base for{" "}
                                {contractEthLabels.mint
                                    ? `${contractEthLabels.mint} ETH`
                                    : "the live mint price"}{" "}
                                → permanently yours, forever provable.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-gold/10 bg-card/80">
                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-3 lg:px-12">
                    <div>
                        <p className="font-serif text-[2rem] font-light text-gold-bright">
                            Uzoza
                        </p>
                        <p className="mt-1 font-serif text-[1rem] text-soft/78">
                            सौन्दर्य
                        </p>
                        <p className="mt-4 max-w-xs text-sm leading-7 text-soft/70">
                            Beauty intelligence for honest self-review. Built on
                            Base. Powered by Uzoza Oracle.
                        </p>
                    </div>

                    <div className="space-y-3 text-[0.72rem] uppercase tracking-[0.2em] text-soft/62">
                        <p>How It Works · Rankings · Access Plans</p>
                        <p>Privacy · Terms</p>
                    </div>

                    <div className="space-y-3 text-[0.72rem] uppercase tracking-[0.2em] text-soft/62 lg:text-right">
                        <p>✦ Deployed on Base</p>
                        <p>✦ Scores stored onchain</p>
                        <p>✦ Open for anyone to verify</p>
                    </div>
                </div>

                <div className="border-t border-gold/10 px-6 py-5 text-center text-[0.7rem] uppercase tracking-[0.18em] text-soft/52 sm:px-8 lg:px-12">
                    © 2025 Uzoza · All analyses are private. All
                    minted scores are permanent.
                </div>
            </footer>

            <AnalysisModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsUploading(false);
                    setResult(null);
                    setUploadedFile(null);
                }}
                imageFile={uploadedFile}
                analysisResult={isUploading ? null : result}
            />
            <DowntimeModal
                isOpen={downtimeOpen}
                onClose={() => setDowntimeOpen(false)}
            />
        </div>
    );
}
