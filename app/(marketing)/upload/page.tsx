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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Your Soundarya
          </h1>
          <p className="text-gray-600">
            Upload a photo to get your personalized beauty analysis powered by AI
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <DropZone onResult={handleAnalysisResult} />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your photos are processed securely and deleted within 1 hour.</p>
          <p className="mt-1">Free analysis includes basic scores and tips.</p>
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