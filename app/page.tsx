"use client";

import { useRef, useState } from "react";
import { AnalysisModal } from "@/components/upload/AnalysisModal";
import { getOrCreateSessionId } from "@/lib/session";
import type { AnalysisPublic } from "@/types/analysis";

const processSteps = [
    {
        title: "Upload Photo",
        description:
            "Provide a clear, front-facing image for accurate facial landmark extraction and harmony analysis.",
        icon: "✦",
    },
    {
        title: "Instant Analysis",
        description:
            "Our AI evaluates symmetry, golden ratio alignment, and dimensional proportion within seconds.",
        icon: "⚡",
    },
    {
        title: "Get Your Report",
        description:
            "Receive your beauty score, percentile rank, and practical guidance tailored to your facial structure.",
        icon: "▤",
    },
];

const plans = [
    {
        name: "Free",
        price: "$0",
        note: "One time preview",
        features: ["Overall score", "Symmetry rating", "Percentile rank"],
    },
    {
        name: "Premium",
        price: "$19",
        note: "One time payment",
        features: [
            "All Free features",
            "Dimensional breakdown",
            "Personalised feature insights",
            "Downloadable report",
        ],
        featured: true,
    },
    {
        name: "Elite",
        price: "$49",
        note: "One time payment",
        features: [
            "All Premium features",
            "Style guidance",
            "Grooming recommendations",
            "Priority AI analysis",
        ],
        badge: "Best Value",
    },
];

const metrics = [
    { label: "Symmetry", value: 97 },
    { label: "Golden Ratio", value: 82 },
    { label: "Proportion", value: 72 },
    { label: "Harmony", value: 91 },
];

function SectionHeading({
    eyebrow,
    title,
    accent,
}: {
    eyebrow?: string;
    title: string;
    accent?: string;
}) {
    const parts = accent ? title.split(accent) : [title];

    return (
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
            {eyebrow ? (
                <div className="flex w-full items-center gap-4 text-[0.65rem] uppercase tracking-[0.45em] text-[#b88c52]">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8e6738]/60 to-transparent" />
                    <span>{eyebrow}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8e6738]/60 to-transparent" />
                </div>
            ) : null}
            <h2 className="font-serif text-[clamp(2.6rem,5vw,4.65rem)] font-light leading-none tracking-[-0.03em] text-[#f3e4ca]">
                {parts.map((part, index) => (
                    <span key={`${part}-${index}`}>
                        {part}
                        {accent && index < parts.length - 1 ? (
                            <span className="font-normal italic text-[#d8a764]">
                                {accent}
                            </span>
                        ) : null}
                    </span>
                ))}
            </h2>
        </div>
    );
}

export default function Home() {
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<AnalysisPublic | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file || !file.type.startsWith("image/")) return;

        setUploadedFile(file);
        setIsUploading(true);
        setIsModalOpen(true);
        setResult(null);

        try {
            const sessionId = getOrCreateSessionId();
            const formData = new FormData();
            formData.append("photo", file);
            formData.append("sessionId", sessionId);

            const response = await fetch("/api/analyse", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Analysis failed");
            }

            const data = await response.json();
            setResult(data);
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
        <div className="relative min-h-screen overflow-hidden bg-[#0d0a07] text-[#f3e4ca]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(192,140,74,0.18),transparent_36%),radial-gradient(circle_at_82%_16%,rgba(205,159,91,0.12),transparent_20%),radial-gradient(circle_at_16%_28%,rgba(132,82,32,0.12),transparent_24%),linear-gradient(180deg,#17110d_0%,#0d0a07_24%,#120d09_55%,#0d0a07_100%)]" />
                <div className="absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_80%_18%,rgba(216,167,100,0.5)_0,transparent_2px),radial-gradient(circle_at_78%_22%,rgba(216,167,100,0.35)_0,transparent_1px),radial-gradient(circle_at_24%_34%,rgba(160,111,56,0.24)_0,transparent_1px)] [background-size:220px_220px,170px_170px,260px_260px]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_12%),linear-gradient(90deg,transparent,rgba(201,169,110,0.05)_48%,transparent_100%)]" />
            </div>

            <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#8e6738]/20 bg-[#120d09]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
                    <button
                        onClick={() => scrollToSection("hero")}
                        className="text-left transition-opacity hover:opacity-80"
                    >
                        <p className="font-serif text-2xl leading-none tracking-[0.05em] text-[#d6ad73]">
                            Soundarya
                        </p>
                        <p className="mt-1 text-[0.58rem] uppercase tracking-[0.42em] text-[#bda58a]/70">
                            Beauty Intelligence
                        </p>
                    </button>

                    <div className="hidden items-center gap-8 md:flex">
                        <button
                            onClick={() => scrollToSection("process")}
                            className="text-[0.66rem] uppercase tracking-[0.35em] text-[#cbb79a]/70 transition-colors hover:text-[#e5be84]"
                        >
                            Process
                        </button>
                        <button
                            onClick={() => scrollToSection("pricing")}
                            className="text-[0.66rem] uppercase tracking-[0.35em] text-[#cbb79a]/70 transition-colors hover:text-[#e5be84]"
                        >
                            Pricing
                        </button>
                        <button
                            onClick={() => scrollToSection("preview")}
                            className="text-[0.66rem] uppercase tracking-[0.35em] text-[#cbb79a]/70 transition-colors hover:text-[#e5be84]"
                        >
                            Preview
                        </button>
                    </div>

                    <button
                        onClick={() => scrollToSection("upload")}
                        className="inline-flex items-center gap-3 border border-[#c49a63]/60 bg-[linear-gradient(90deg,rgba(177,126,65,0.86),rgba(236,205,149,0.96))] px-5 py-3 text-[0.66rem] uppercase tracking-[0.3em] text-[#1b130d] shadow-[0_18px_48px_rgba(88,56,22,0.35)] transition duration-300 hover:brightness-110"
                    >
                        Begin
                    </button>
                </div>
            </nav>

            <main className="relative z-10">
                <section
                    id="hero"
                    className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-5 pb-24 pt-32 sm:px-8 lg:px-12"
                >
                    <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
                        <div className="mb-10 h-px w-full bg-gradient-to-r from-transparent via-[#8e6738]/40 to-transparent" />
                        <h1 className="max-w-5xl font-serif text-[clamp(3.4rem,8vw,6.8rem)] font-light leading-[0.96] tracking-[-0.05em] text-[#f5e5cd]">
                            Discover Your{" "}
                            <span className="font-normal italic text-[#d8a764]">
                                True Beauty
                            </span>{" "}
                            Score
                        </h1>
                        <p className="mt-8 border-y border-[#8e6738]/30 px-6 py-3 font-serif text-[clamp(1.6rem,3vw,2.35rem)] text-[#d6a05d]">
                            सौंदर्य प्रमाणित
                        </p>
                        <p className="mt-8 max-w-3xl text-[clamp(1rem,1.5vw,1.32rem)] leading-[1.9] tracking-[0.02em] text-[#d7c4a5]/80">
                            Ancient wisdom meets modern intelligence. Upload one clear photo
                            and receive a premium facial harmony analysis based on symmetry,
                            golden ratio, and structural balance.
                        </p>
                        <button
                            onClick={() => scrollToSection("upload")}
                            className="group mt-12 inline-flex items-center gap-5 border border-[#d4a76b]/70 bg-[linear-gradient(90deg,rgba(181,127,64,0.92),rgba(240,208,153,0.98))] px-8 py-5 text-[0.78rem] uppercase tracking-[0.34em] text-[#1b130d] shadow-[0_30px_80px_rgba(84,53,22,0.45)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
                        >
                            Upload Your Photo
                            <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                                →
                            </span>
                        </button>
                    </div>
                </section>

                <section
                    id="process"
                    className="border-y border-[#6d4d27]/30 bg-[linear-gradient(180deg,rgba(20,13,9,0.88),rgba(27,18,12,0.72))] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
                >
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading title="The Process" />
                        <div className="mt-14 grid gap-6 lg:grid-cols-3">
                            {processSteps.map((step) => (
                                <article
                                    key={step.title}
                                    className="relative overflow-hidden border border-[#8e6738]/35 bg-[linear-gradient(180deg,rgba(30,20,14,0.84),rgba(22,15,10,0.7))] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.22)] transition duration-300 hover:border-[#c29761]/55 hover:bg-[linear-gradient(180deg,rgba(36,25,17,0.92),rgba(24,16,11,0.78))]"
                                >
                                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#8e6738]/45 bg-[#1a120d]/70 font-serif text-3xl text-[#dfb06f]">
                                        {step.icon}
                                    </div>
                                    <h3 className="font-serif text-[clamp(2rem,3.4vw,2.85rem)] font-light tracking-[-0.03em] text-[#f1dfc4]">
                                        {step.title}
                                    </h3>
                                    <p className="mt-4 max-w-sm text-[1rem] leading-8 text-[#ccb99d]/78">
                                        {step.description}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-5 py-8 sm:px-8 lg:px-12">
                    <div className="mx-auto max-w-7xl">
                        <div
                            id="upload"
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative overflow-hidden border border-dashed border-[#af7d43]/55 bg-[linear-gradient(90deg,rgba(40,25,16,0.86),rgba(66,42,24,0.74),rgba(39,25,16,0.86))] px-6 py-12 text-center shadow-[0_28px_70px_rgba(0,0,0,0.2)] transition duration-300 hover:border-[#d5a66a]/75 hover:brightness-110 sm:px-8"
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
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,167,100,0.08),transparent_56%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                            <p className="text-[clamp(1.15rem,2vw,1.7rem)] uppercase tracking-[0.46em] text-[#e0b170]">
                                Drop Your Photo Here
                            </p>
                            <p className="mt-3 text-[0.76rem] uppercase tracking-[0.32em] text-[#c8b394]/70">
                                Click to upload · Max 10MB
                            </p>
                        </div>
                    </div>
                </section>

                <section
                    id="pricing"
                    className="px-5 pb-18 pt-12 sm:px-8 sm:pb-24 lg:px-12"
                >
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading eyebrow="Pricing" title="Choose Your Plan" accent="Plan" />
                        <div className="mt-14 grid gap-6 xl:grid-cols-3">
                            {plans.map((plan) => (
                                <article
                                    key={plan.name}
                                    className={[
                                        "relative flex h-full flex-col overflow-hidden border bg-[linear-gradient(180deg,rgba(25,17,12,0.92),rgba(19,13,9,0.88))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.26)]",
                                        plan.featured
                                            ? "border-[#d4a76b] ring-1 ring-[#d4a76b]/30"
                                            : "border-[#8e6738]/30",
                                    ].join(" ")}
                                >
                                    {plan.badge ? (
                                        <div className="absolute right-0 top-5 bg-[#d6aa6d] px-4 py-1 text-[0.66rem] uppercase tracking-[0.2em] text-[#22160f]">
                                            {plan.badge}
                                        </div>
                                    ) : null}

                                    <h3 className="font-serif text-[clamp(2.3rem,4vw,3.5rem)] font-light tracking-[-0.04em] text-[#f1dfc4]">
                                        {plan.name}
                                    </h3>
                                    <div className="mt-7 border-y border-[#8e6738]/25 py-7">
                                        <p className="font-serif text-[clamp(4.4rem,7vw,6rem)] font-light leading-none text-[#d8a764]">
                                            {plan.price}
                                        </p>
                                        <p className="mt-3 text-[0.74rem] uppercase tracking-[0.42em] text-[#b89f80]/72">
                                            {plan.note}
                                        </p>
                                    </div>

                                    <ul className="mt-8 flex-1 space-y-4">
                                        {plan.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-start gap-3 text-[1rem] leading-7 text-[#d5c1a4]/80"
                                            >
                                                <span className="mt-1 text-[#d6a05d]">✧</span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => scrollToSection("upload")}
                                        className={[
                                            "mt-10 border px-6 py-4 text-[0.72rem] uppercase tracking-[0.34em] transition duration-300",
                                            plan.featured
                                                ? "border-[#c89d61] bg-[linear-gradient(90deg,rgba(177,126,65,0.9),rgba(240,208,153,0.98))] text-[#1d140e] hover:brightness-110"
                                                : "border-[#8e6738]/45 bg-transparent text-[#d8b27a] hover:bg-[#b88545]/10",
                                        ].join(" ")}
                                    >
                                        Get Started
                                    </button>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="preview"
                    className="px-5 pb-24 sm:px-8 lg:px-12"
                >
                    <div className="mx-auto max-w-7xl overflow-hidden border border-[#8e6738]/30 bg-[linear-gradient(180deg,rgba(27,18,12,0.9),rgba(18,13,9,0.92))] shadow-[0_32px_90px_rgba(0,0,0,0.3)]">
                        <div className="border-b border-[#8e6738]/25 px-8 py-10 sm:px-12">
                            <SectionHeading eyebrow="Preview" title="Result Preview" accent="Preview" />
                        </div>

                        <div className="grid gap-10 px-8 py-12 sm:px-12 lg:grid-cols-[240px_1fr] lg:items-center">
                            <div>
                                <p className="font-serif text-[clamp(4.8rem,8vw,6.8rem)] font-light leading-none text-[#d9aa67]">
                                    8.3
                                </p>
                                <p className="mt-3 text-[0.7rem] uppercase tracking-[0.4em] text-[#c3ac8d]/72">
                                    Out of top
                                </p>
                                <p className="mt-2 text-[0.7rem] uppercase tracking-[0.4em] text-[#c3ac8d]/72">
                                    1 percentile
                                </p>
                            </div>

                            <div className="space-y-5">
                                {metrics.map((metric) => (
                                    <div key={metric.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5">
                                        <div className="space-y-3">
                                            <p className="text-[0.72rem] uppercase tracking-[0.38em] text-[#c3ac8d]/72">
                                                {metric.label}
                                            </p>
                                            <div className="h-px bg-[#5a4124]">
                                                <div
                                                    className="h-px bg-[#d9aa67]"
                                                    style={{ width: `${metric.value}%` }}
                                                />
                                            </div>
                                        </div>
                                        <p className="font-serif text-[1.9rem] leading-none text-[#d9aa67]">
                                            {metric.value}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-[#8e6738]/25 px-8 py-8 sm:px-12">
                            <p className="max-w-5xl font-serif text-[clamp(1.05rem,1.7vw,1.35rem)] italic leading-relaxed text-[#d8c5a8]/84">
                                “Strong structural harmony with excellent ratio adherence and
                                balanced upper-to-lower facial thirds.”
                            </p>
                        </div>
                    </div>
                </section>

                <footer className="border-t border-[#8e6738]/25 bg-[#120d09]/80 px-5 py-10 sm:px-8 lg:px-12">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="font-serif text-3xl text-[#d6ad73]">Soundarya</p>
                            <p className="mt-2 text-[0.68rem] uppercase tracking-[0.38em] text-[#bba285]/68">
                                सौंदर्य · Beauty Intelligence
                            </p>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-[#ccb99d]/72">
                            Premium facial harmony analysis shaped by editorial restraint,
                            precise scoring, and an intentionally elevated dark aesthetic.
                        </p>
                        <div className="flex gap-6 text-[0.68rem] uppercase tracking-[0.3em] text-[#bba285]/68">
                            <button className="transition-colors hover:text-[#e5be84]">
                                Privacy
                            </button>
                            <button className="transition-colors hover:text-[#e5be84]">
                                Terms
                            </button>
                            <button className="transition-colors hover:text-[#e5be84]">
                                Contact
                            </button>
                        </div>
                    </div>
                </footer>
            </main>

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
        </div>
    );
}
