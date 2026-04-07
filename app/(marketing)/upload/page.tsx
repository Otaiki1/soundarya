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
    <div className="page-shell">
      <div className="section-shell max-w-3xl">
        <div className="text-center mb-12 sm:mb-14">
          <p className="eyebrow mb-4">Analysis</p>
          <h1 className="heading-display text-[clamp(2rem,4vw,3.25rem)] text-text mb-4">
            Discover Your <em className="text-gold">Uzoza</em>
          </h1>
          <p className="text-sm text-soft max-w-xl mx-auto leading-relaxed">
            Upload a photo to get your personalized beauty analysis powered by AI
          </p>
        </div>

        <div className="surface-card p-2 sm:p-3">
          <DropZone onResult={handleAnalysisResult} />
        </div>

        <div className="mt-8 text-center text-[11px] text-soft space-y-2">
          <p>Your photos are processed securely and deleted within 1 hour.</p>
          <p className="text-gold">Free analysis includes basic scores and tips.</p>
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