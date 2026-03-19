'use client'
import { useState } from 'react'

interface ShareRowProps {
  analysisId: string
}

export function ShareRow({ analysisId }: ShareRowProps) {
  const [copied, setCopied] = useState(false)
  
  // Safe way to get origin on client
  const getOrigin = () => {
    if (typeof window !== 'undefined') return window.location.origin
    return ''
  }
  
  const shareUrl = `${getOrigin()}/analyse/${analysisId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareTwitter = () => {
    const text = `Check out my Soundarya beauty analysis! 👀`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank')
  }

  const handleShareWhatsApp = () => {
    const text = `Check out my Soundarya beauty analysis! ${shareUrl}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="surface-card p-6 sm:p-8 lg:p-10">
      <div className="mb-6 sm:mb-8">
        <p className="eyebrow mb-3 opacity-80">Community</p>
        <h3 className="font-serif text-2xl lg:text-4xl font-light text-text leading-tight">
          Share Your <em className="text-gold">Results</em>
        </h3>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-8 sm:mb-10">
        {[
          { label: copied ? 'Copied' : 'Copy Link', icon: copied ? '✓' : '🔗', action: handleCopyLink, active: copied },
          { label: 'Twitter', icon: '𝕏', action: handleShareTwitter },
          { label: 'WhatsApp', icon: '💬', action: handleShareWhatsApp }
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`flex items-center justify-center gap-3 px-4 py-3 border text-[10px] tracking-[0.16em] uppercase transition-all rounded-sm ${btn.active ? 'border-gold text-gold bg-gold/5' : 'border-white/10 text-muted hover:border-gold hover:text-gold hover:bg-gold/5'}`}
          >
            <span className="text-base">{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8 border border-gold/20 bg-gold/5 text-center relative overflow-hidden group rounded-sm">
        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10">
          <h4 className="font-serif text-2xl lg:text-3xl text-gold-light mb-3 font-light">Want the <em className="italic">Full Report?</em></h4>
          <p className="text-sm leading-relaxed text-soft mb-6 max-w-xl mx-auto">Unlock 20 personalized beauty tips, precise feature mapping, and a detailed dimensional breakdown curated for your unique face.</p>
          <button className="btn-primary shadow-[0_20px_40px_rgba(201,169,110,0.2)]">
            Unlock Elite Tips — $19
          </button>
        </div>
      </div>
    </div>
  )
}