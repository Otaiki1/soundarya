'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getOrCreateSessionId } from '@/lib/session'
import { AnalysisModal } from '@/components/upload/AnalysisModal'
import type { AnalysisPublic } from '@/types/analysis'

export default function Home() {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<AnalysisPublic | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll reveal
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    
    reveals.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return
    setUploadedFile(file)

    setIsUploading(true)
    setIsModalOpen(true)
    setResult(null)

    try {
      const sessionId = getOrCreateSessionId()
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('sessionId', sessionId)

      const response = await fetch('/api/analyse', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Analysis failed')
      
      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-deep text-text selection:bg-gold-dark selection:text-deep">
      <nav className="fixed inset-x-0 top-0 z-100 bg-[rgba(13,10,7,0.95)] backdrop-blur-md border-b border-gold/15">
        <div className="relative h-20 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 flex items-center justify-between">
          <div className="leading-none">
            <p className="font-serif text-[30px] text-gold tracking-[0.08em]">Soundarya</p>
            <p className="text-[9px] tracking-[0.25em] text-muted uppercase mt-1">सौन्दर्य · Beauty Intelligence</p>
          </div>

          <ul className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <li><button onClick={() => scrollToSection('how-it-works')} className="text-[11px] uppercase tracking-[0.2em] text-muted hover:text-gold">Process</button></li>
            <li><button onClick={() => scrollToSection('analysis')} className="text-[11px] uppercase tracking-[0.2em] text-muted hover:text-gold">Analysis</button></li>
            <li><button onClick={() => scrollToSection('pricing')} className="text-[11px] uppercase tracking-[0.2em] text-muted hover:text-gold">Pricing</button></li>
          </ul>

          <div className="justify-self-end">
            <button
              onClick={() => scrollToSection('upload')}
              className="hidden sm:inline-flex px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] border border-gold text-gold bg-transparent hover:bg-gold hover:text-deep transition-colors"
            >
              Begin Analysis
            </button>
          </div>
        </div>
      </nav>

      <section className="min-h-screen pt-[120px] pb-14 sm:pb-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[calc(100vh-120px)]">
          <div className="reveal">
            <p className="text-gold text-[10px] tracking-[0.35em] uppercase mb-6">AI-Powered Facial Analysis</p>
            <h1 className="font-serif text-[clamp(2.4rem,6vw,5.2rem)] leading-[1.05] font-light mb-5">
              Discover Your <em className="text-gold italic">True Beauty</em> Score
            </h1>
            <p className="text-gold-dark italic text-[clamp(1rem,2vw,1.35rem)] mb-6 font-serif">सौन्दर्यं परमं धनम्</p>
            <p className="text-muted text-base max-w-xl leading-relaxed mb-10">
              Ancient wisdom meets modern intelligence. Upload one clear photo and receive a premium facial harmony analysis based on symmetry, golden ratio, and structural balance.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <button onClick={() => scrollToSection('upload')} className="btn-gold-primary">Upload Your Photo</button>
              <button onClick={() => scrollToSection('how-it-works')} className="inline-flex items-center gap-3 text-gold text-[12px] uppercase tracking-[0.2em] hover:text-gold-light">
                <span className="h-px w-8 bg-gold/70"></span>
                Learn More →
              </button>
            </div>
          </div>

          <div className="reveal flex justify-center lg:justify-end">
            <div className="relative w-[360px] h-[360px] sm:w-[440px] sm:h-[440px]">
              <svg viewBox="0 0 440 440" className="absolute inset-0 w-full h-full animate-spin-slow">
                <circle cx="220" cy="220" r="170" fill="none" stroke="rgba(201,169,110,0.35)" strokeWidth="1.5" strokeDasharray="6 10" />
                <circle cx="220" cy="220" r="196" fill="none" stroke="rgba(201,169,110,0.2)" strokeWidth="1" strokeDasharray="2 14" />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[250px] sm:w-[290px] bg-card border border-gold/25 p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-4">Sample Analysis</p>
                  <div className="font-serif text-[70px] leading-none text-gold">8.4</div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-muted mb-6">Overall Score</p>
                  <div className="space-y-3 text-[12px]">
                    <div className="flex justify-between"><span className="text-muted">Symmetry</span><span className="text-gold">91%</span></div>
                    <div className="flex justify-between"><span className="text-muted">Global Rank</span><span className="text-gold">Top 15%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="text-center mb-14 reveal">
            <p className="text-gold text-[10px] uppercase tracking-[0.3em] mb-4">The Process</p>
            <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light">How It <em className="text-gold">Works</em></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: '01', icon: '📸', title: 'Upload Photo', desc: 'Provide a clear front-facing image for accurate facial landmark extraction and harmony detection.' },
              { num: '02', icon: '⚡', title: 'Instant Analysis', desc: 'Our AI evaluates symmetry, golden ratio alignment, and dimensional proportion within seconds.' },
              { num: '03', icon: '✦', title: 'Get Your Report', desc: 'Receive your beauty score, percentile rank, and practical insights tailored to your features.' }
            ].map((step) => (
              <div key={step.num} className="reveal relative bg-card border border-gold/20 p-8 transition-colors hover:border-gold/50">
                <span className="absolute top-5 right-6 font-serif text-6xl text-gold/10 select-none">{step.num}</span>
                <div className="w-14 h-14 rounded-full border border-gold/30 flex items-center justify-center text-2xl mb-6">{step.icon}</div>
                <h3 className="font-serif text-[30px] text-gold-light mb-3">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="analysis" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="reveal">
            <p className="text-gold text-[10px] uppercase tracking-[0.3em] mb-4">Science of Beauty</p>
            <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-tight mb-5">A Complete <em className="text-gold">Aesthetic</em> Breakdown</h2>
            <p className="text-muted text-base leading-relaxed mb-10 max-w-xl">
              Soundarya scores your facial structure across timeless aesthetic dimensions and modern computational markers.
            </p>

            <div className="space-y-6">
              {[
                { label: 'Symmetry', score: 87 },
                { label: 'Golden Ratio', score: 92 },
                { label: 'Harmony', score: 78 },
                { label: 'Bone Structure', score: 81 }
              ].map((metric) => (
                <div key={metric.label} className="flex items-center gap-4">
                  <span className="w-34 shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted">{metric.label}</span>
                  <div className="flex-1 h-[2px] bg-white/10">
                    <div className="h-full bg-linear-to-r from-gold-dark to-gold" style={{ width: `${metric.score}%` }} />
                  </div>
                  <span className="w-12 text-right text-[11px] text-gold">{metric.score}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal">
            <div className="bg-card border border-gold/20 p-8 lg:p-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Average Score</p>
              <p className="font-serif text-[110px] leading-none text-gold">8.3</p>
              <p className="text-[12px] uppercase tracking-[0.14em] text-muted mb-8">out of 10 · Top 18 percentile</p>
              <p className="text-sm text-muted italic leading-relaxed mb-8">
                "Strong structural harmony with excellent ratio adherence and balanced upper-to-lower facial thirds."
              </p>

              <div className="border border-gold/30 bg-gold/10 px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold">Premium Tip Locked</span>
                <span className="text-gold">🔒</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="text-center mb-14 reveal">
            <p className="text-gold text-[10px] uppercase tracking-[0.3em] mb-4">Pricing</p>
            <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light">Choose Your <em className="text-gold">Plan</em></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {[
              { name: 'Free', price: '0', features: ['Overall score', 'Symmetry rating', 'Percentile rank'] },
              { name: 'Premium', price: '19', featured: true, features: ['All Free features', 'Dimensional breakdown', '20 personalized tips', 'PDF report'] },
              { name: 'Elite', price: '49', features: ['All Premium features', 'Skincare guidance', 'Grooming insights', 'Priority processing'] }
            ].map((plan) => (
              <div key={plan.name} className={`reveal flex flex-col p-8 border ${plan.featured ? 'border-gold bg-card' : 'border-gold/20 bg-card/40'}`}>
                {plan.featured && (
                  <p className="text-[10px] uppercase tracking-[0.28em] text-gold mb-3">Most Popular</p>
                )}
                <h3 className="font-serif text-3xl text-gold-light mb-4">{plan.name}</h3>
                <p className="font-serif text-6xl text-gold leading-none mb-3">${plan.price}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted mb-6">One-time payment</p>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted">
                      <span className="text-gold text-[12px] mt-[3px]">◆</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => scrollToSection('upload')}
                  className={`w-full py-3 text-[11px] uppercase tracking-[0.2em] border border-gold transition-colors ${plan.featured ? 'bg-gold text-deep hover:bg-gold-light' : 'text-gold hover:bg-gold hover:text-deep'}`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="upload" className="py-20 sm:py-24 bg-surface/60">
        <div className="max-w-[700px] mx-auto px-5 sm:px-8 text-center">
          <p className="text-gold text-[10px] uppercase tracking-[0.3em] mb-4 reveal">Upload</p>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light mb-6 reveal">Start Your <em className="text-gold">Analysis</em></h2>

          <div className="reveal relative border-2 border-dashed border-gold/35 bg-card p-20 hover:border-gold/60 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="text-4xl text-gold mb-4">✦</div>
            <h3 className="font-serif text-4xl text-gold-light mb-3">Drop your photo here</h3>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">or click to browse · Max 10MB</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gold/20 py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 grid md:grid-cols-3 gap-5 items-center text-center md:text-left">
          <div>
            <p className="font-serif text-xl text-gold">Soundarya</p>
          </div>
          <p className="text-[11px] text-muted uppercase tracking-[0.12em] md:text-center">© 2025 Soundarya</p>
          <div className="flex justify-center md:justify-end gap-5 text-[11px] text-muted uppercase tracking-[0.12em]">
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms</Link>
            <Link href="/contact" className="hover:text-gold">Contact</Link>
          </div>
        </div>
      </footer>

      <AnalysisModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setIsUploading(false)
          setResult(null)
          setUploadedFile(null)
        }}
        imageFile={uploadedFile}
        analysisResult={isUploading ? null : result}
      />

      <style jsx>{`
        .btn-gold-primary {
          background: var(--gold);
          color: var(--deep);
          border: none;
          padding: 14px 34px;
          font-family: var(--font-josefin), sans-serif;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .btn-gold-primary:hover {
          background: var(--gold-light);
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(201,169,110,0.25);
        }
        
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-spin-slow {
          animation: rotate-slow 30s linear infinite;
        }

        @keyframes rotate-slow {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
