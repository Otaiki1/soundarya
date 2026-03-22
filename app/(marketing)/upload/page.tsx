'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropZone } from '@/components/upload/DropZone'
import { ResultModal } from '@/components/upload/ResultModal'
import type { AnalysisPublic } from '@/types/analysis'

export default function UploadPage() {
  const [result, setResult] = useState<AnalysisPublic | null>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const handleAnalysisResult = (data: AnalysisPublic) => {
    setResult(data)
    setShowModal(true)
  }

  const handleViewFullReport = () => {
    if (result) {
      router.push(`/analyse/${result.id}`)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setResult(null)
  }

  return (
    <div className="page-shell pt-32 sm:pt-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="reveal">
            <p className="eyebrow mb-6">Computational Analysis</p>
            <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-light text-text mb-8">
              Submit Your <br />
              <em className="text-gold italic">Portrait</em>
            </h1>
            <p className="text-base lg:text-lg text-soft max-w-xl leading-relaxed font-light tracking-wide mb-12">
              Our analysis requires a clear, front-facing image to evaluate facial geometry across 68 structural markers. 
              Results are calculated with scientific precision based on symmetry and golden ratio alignment.
            </p>
            
            <div className="space-y-6 border-l border-border-light pl-8">
              <div>
                <h4 className="text-[10px] tracking-[0.2em] uppercase text-gold mb-2">Privacy First</h4>
                <p className="text-xs text-muted font-light leading-relaxed">
                  Your biometric data is processed in a secure ephemeral environment and deleted automatically.
                </p>
              </div>
              <div>
                <h4 className="text-[10px] tracking-[0.2em] uppercase text-gold mb-2">Technical Guidance</h4>
                <p className="text-xs text-muted font-light leading-relaxed">
                  Avoid heavy filters or angled shots for the most precise harmonic calibration.
                </p>
              </div>
            </div>
          </div>

          <div className="reveal lg:mt-12">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gold/5 blur-3xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <DropZone onResult={handleAnalysisResult} />
            </div>
          </div>
        </div>
      </div>

      {result && (
        <ResultModal
          result={result}
          isOpen={showModal}
          onClose={handleCloseModal}
          onViewFullReport={handleViewFullReport}
        />
      )}
    </div>
  )
}