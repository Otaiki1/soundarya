"use client";

import { useState, useRef } from "react";
import { AnalysisModal } from "@/components/upload/AnalysisModal";
import { PayToScanModal } from "@/components/payment/PayToScanModal";
import { useSubscribe } from "@/hooks/useSubscribe";
import type { AnalysisPublic } from "@/types/analysis";
import { getOrCreateSessionId } from "@/lib/session";

export default function Home() {
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<AnalysisPublic | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const { isSubscribed } = useSubscribe();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
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

            if (!response.ok) throw new Error("Analysis failed");
            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
            setPendingFile(null);
        }
    };

    const handleFile = async (file: File) => {
        if (!file || !file.type.startsWith("image/")) return;
        
        if (!isSubscribed) {
            setPendingFile(file);
            setIsPaymentModalOpen(true);
            return;
        }

        await processFile(file);
    };

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        if (pendingFile) {
            processFile(pendingFile);
        }
    };

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-deep text-text">
            {/* NAVIGATION */}
            <nav className="fixed inset-x-0 top-0 z-50 bg-deep/90 backdrop-blur-md border-b border-gold/10">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
                    <div className="leading-none">
                        <p className="font-serif text-xl text-gold tracking-[0.08em]">
                            Soundarya
                        </p>
                        <p className="text-[7px] tracking-[0.3em] text-muted uppercase mt-1 font-medium">
                            BEAUTY INTELLIGENCE
                        </p>
                    </div>

                    <div className="hidden md:flex items-center gap-12">
                        <button
                            onClick={() => scrollToSection("process")}
                            className="text-[9px] uppercase tracking-[0.25em] text-muted hover:text-gold transition-colors"
                        >
                            Process
                        </button>
                        <button
                            onClick={() => scrollToSection("pricing")}
                            className="text-[9px] uppercase tracking-[0.25em] text-muted hover:text-gold transition-colors"
                        >
                            Pricing
                        </button>
                    </div>

                    <button
                        onClick={() => scrollToSection("upload")}
                        className="hidden sm:block btn-secondary"
                    >
                        Begin
                    </button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="min-h-screen flex items-center justify-center pt-24 px-6 sm:px-8 lg:px-12 bg-deep relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-96 h-96 bg-gold/5 rounded-full blur-3xl opacity-40"></div>
                </div>

                <div className="max-w-5xl w-full text-center relative z-10 reveal">
                    <h1 className="font-serif text-[clamp(2.8rem,9vw,6rem)] leading-[1.08] font-light text-text mb-6">
                        Discover Your{" "}
                        <span className="text-gold font-normal italic">
                            True Beauty
                        </span>{" "}
                        Score
                    </h1>

                    <p className="font-serif text-gold text-xl sm:text-2xl tracking-[0.16em] mb-12 font-light">
                        सौन्दर्य प्रमाणित
                    </p>

                    <p className="text-soft text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-light tracking-wider mb-16 opacity-75">
                        Ancient wisdom meets modern intelligence. Upload one
                        clear photo and receive a premium facial harmony
                        analysis based on symmetry, golden ratio, and structural
                        balance.
                    </p>

                    <button
                        onClick={() => scrollToSection("upload")}
                        className="group inline-flex items-center gap-5 btn-gold"
                    >
                        UPLOAD YOUR PHOTO{" "}
                        <span className="text-lg transition-transform group-hover:translate-x-1">
                            ⟶
                        </span>
                    </button>
                </div>
            </section>

            {/* PROCESS SECTION */}
            <section
                id="process"
                className="py-32 sm:py-40 px-6 sm:px-8 lg:px-12 bg-deep"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-8 mb-24 reveal">
                        <div className="h-px flex-1 bg-gold/20"></div>
                        <h2 className="font-serif text-3xl sm:text-4xl font-light text-text whitespace-nowrap">
                            The Process
                        </h2>
                        <div className="h-px flex-1 bg-gold/20"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-10 reveal">
                        {[
                            {
                                title: "Upload Photo",
                                desc: "Provide a clear, front-facing image for accurate facial landmark extraction and harmony analysis.",
                            },
                            {
                                title: "Instant Analysis",
                                desc: "Our AI evaluates symmetry, golden ratio alignment, and dimensional proportion within seconds.",
                            },
                            {
                                title: "Get Your Report",
                                desc: "Receive your beauty score, percentile rank, and practical insights tailored to your features.",
                            },
                        ].map((step, idx) => (
                            <div
                                key={idx}
                                className="group p-10 sm:p-12 border border-gold/15 bg-surface/40 hover:bg-surface/60 rounded-sm transition-all duration-500"
                            >
                                <div className="w-12 h-12 mb-8 rounded-full border border-gold/30 flex items-center justify-center text-gold text-lg group-hover:border-gold/60 group-hover:bg-gold/5 transition-all">
                                    {String(idx + 1).padStart(2, "0")}
                                </div>
                                <h3 className="font-serif text-2xl text-text mb-4 font-light">
                                    {step.title}
                                </h3>
                                <p className="text-[12px] leading-relaxed text-soft font-light opacity-70">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section
                id="pricing"
                className="py-32 sm:py-40 px-6 sm:px-8 lg:px-12 bg-surface/30"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-8 mb-24 reveal">
                        <div className="h-px flex-1 bg-gold/20"></div>
                        <h2 className="font-serif text-3xl sm:text-4xl font-light text-text whitespace-nowrap">
                            Choose Your Plan
                        </h2>
                        <div className="h-px flex-1 bg-gold/20"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8 reveal">
                        {[
                            {
                                name: "Free",
                                price: "0",
                                features: [
                                    "Overall score",
                                    "Symmetry rating",
                                    "Percentile rank",
                                ],
                                primary: false,
                            },
                            {
                                name: "Unlocked",
                                price: "19",
                                features: [
                                    "All Free features",
                                    "Dimensional breakdown",
                                    "3D personalized tips",
                                    "PDF report",
                                ],
                                primary: true,
                                badge: "POPULAR",
                            },
                            {
                                name: "Elite",
                                price: "49",
                                features: [
                                    "All Premium features",
                                    "Skincare guidance",
                                    "Grooming insights",
                                    "Priority AI analysis",
                                ],
                                primary: false,
                                badge: "BEST VALUE",
                            },
                        ].map((plan) => (
                            <div
                                key={plan.name}
                                className={`flex flex-col p-10 sm:p-12 border rounded-sm transition-all duration-300 relative ${
                                    plan.primary
                                        ? "bg-gold/10 border-gold/40 scale-105 md:scale-100 shadow-lg"
                                        : "border-gold/15 bg-card/50 hover:bg-card/80"
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute top-4 right-4 bg-gold/20 border border-gold/40 text-gold text-[7px] px-2.5 py-1.5 uppercase tracking-[0.2em] font-medium rounded-sm">
                                        {plan.badge}
                                    </div>
                                )}

                                <h3 className="font-serif text-2xl text-text mb-10 font-light">
                                    {plan.name}
                                </h3>

                                <div className="mb-12 border-b border-gold/15 pb-8">
                                    <div className="font-serif text-5xl text-gold leading-none mb-3">
                                        ${plan.price}
                                    </div>
                                    <p className="text-[9px] tracking-[0.2em] text-muted uppercase">
                                        ONE TIME
                                    </p>
                                </div>

                                <ul className="space-y-3.5 mb-12 flex-1">
                                    {plan.features.map((f, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 text-[11px] text-soft font-light"
                                        >
                                            <span className="text-gold text-xs mt-0.5">
                                                ◆
                                            </span>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => scrollToSection("upload")}
                                    className={
                                        plan.primary
                                            ? "btn-gold w-full"
                                            : "btn-secondary w-full"
                                    }
                                >
                                    Get Started
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* RESULTS PREVIEW */}
            <section className="py-32 sm:py-40 px-6 sm:px-8 lg:px-12 bg-deep">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-8 mb-24 reveal">
                        <div className="h-px flex-1 bg-gold/20"></div>
                        <h2 className="font-serif text-3xl sm:text-4xl font-light text-text whitespace-nowrap">
                            Your Results
                        </h2>
                        <div className="h-px flex-1 bg-gold/20"></div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center reveal">
                        <div>
                            <div className="font-serif text-7xl lg:text-8xl text-gold font-light leading-none mb-6">
                                8.3
                            </div>
                            <p className="text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                                OUT OF TOP
                            </p>
                            <p className="text-[10px] tracking-[0.25em] text-muted uppercase">
                                10TH PERCENTILE
                            </p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { label: "Symmetry", val: 97 },
                                { label: "Golden Ratio", val: 82 },
                                { label: "Proportion", val: 72 },
                                { label: "Harmony", val: 91 },
                            ].map((item) => (
                                <div key={item.label} className="group">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[10px] tracking-[0.2em] text-muted uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                                            {item.label}
                                        </span>
                                        <span className="text-[12px] text-gold font-serif opacity-60 group-hover:opacity-100 transition-opacity">
                                            {item.val}%
                                        </span>
                                    </div>
                                    <div className="h-px bg-gold/20 relative overflow-hidden">
                                        <div
                                            className="h-px bg-gold transition-all duration-1000"
                                            style={{ width: `${item.val}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-20 pt-12 border-t border-gold/15 text-center">
                        <p className="text-xs sm:text-sm text-soft italic font-light tracking-wide opacity-60">
                            "Strong structural harmony with excellent ratio
                            adherence and balanced upper-to-lower facial
                            thirds." ◆
                        </p>
                    </div>
                </div>
            </section>

            {/* UPLOAD SECTION */}
            <section
                id="upload"
                className="py-32 sm:py-40 px-6 sm:px-8 lg:px-12"
            >
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16 reveal">
                        <p className="text-gold text-[8px] uppercase tracking-[0.35em] mb-4 font-medium">
                            READY TO DISCOVER?
                        </p>
                        <h2 className="font-serif text-[clamp(2rem,6vw,3.2rem)] leading-tight font-light mb-4">
                            Get Your Soundarya Score
                        </h2>
                        <p className="text-soft text-sm max-w-lg mx-auto">
                            Upload a clear, front-facing photo and get your
                            comprehensive beauty analysis in seconds.
                        </p>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="reveal relative border-2 border-dashed border-gold/40 bg-surface/50 hover:bg-surface/70 hover:border-gold/70 p-20 sm:p-32 rounded-sm transition-all duration-300 group cursor-pointer"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={(e) =>
                                e.target.files?.[0] &&
                                handleFile(e.target.files[0])
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="relative z-10 pointer-events-none text-center">
                            <div className="text-5xl sm:text-6xl text-gold mb-6 group-hover:scale-110 transition-transform">
                                ✦
                            </div>
                            <h3 className="font-serif text-[clamp(1.6rem,4vw,2.4rem)] text-text mb-3 font-light">
                                Drop your photo here
                            </h3>
                            <p className="text-[9px] uppercase tracking-[0.15em] text-muted">
                                or click to upload · max 10mb
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-gold/15 py-16 sm:py-20 bg-card/50">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
                        <div>
                            <p className="font-serif text-xl text-gold mb-2">
                                Soundarya
                            </p>
                            <p className="text-[8px] text-muted uppercase tracking-[0.2em]">
                                सौन्दर्य · Beauty Intelligence
                            </p>
                        </div>
                        <div className="text-[13px] text-soft leading-relaxed">
                            <p>
                                Ancient wisdom meets modern science. AI-powered
                                facial analysis for harmony, symmetry, and
                                attractiveness.
                            </p>
                        </div>
                        <div className="flex justify-center md:justify-end gap-6 text-[10px] text-muted uppercase tracking-[0.12em]">
                            <button className="hover:text-gold transition-colors">
                                Privacy
                            </button>
                            <button className="hover:text-gold transition-colors">
                                Terms
                            </button>
                            <button className="hover:text-gold transition-colors">
                                Contact
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-gold/10 pt-8 text-center text-[9px] text-muted uppercase tracking-[0.15em]">
                        © 2025 Soundarya. All rights reserved.
                    </div>
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

            <PayToScanModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setPendingFile(null);
                }}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
