'use client'
import type { LoadingStage } from '@/types/analysis'

interface LoadingStagesProps {
  currentStage: LoadingStage
}

export function LoadingStages({ currentStage }: LoadingStagesProps) {
  const stages: { key: LoadingStage; label: string; icon: string }[] = [
    { key: 'detecting', label: 'Detecting facial features', icon: '🔍' },
    { key: 'symmetry', label: 'Analyzing symmetry', icon: '⚖️' },
    { key: 'ratio', label: 'Measuring golden ratio', icon: '📐' },
    { key: 'structure', label: 'Evaluating bone structure', icon: '🦴' },
    { key: 'writing', label: 'Writing your analysis', icon: '✍️' }
  ]

  const currentIndex = stages.findIndex(stage => stage.key === currentStage)

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      <div className="text-6xl animate-pulse">
        {stages[currentIndex]?.icon || '⏳'}
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {stages[currentIndex]?.label || 'Processing...'}
        </h3>
        <div className="flex space-x-2 justify-center">
          {stages.map((stage, index) => (
            <div
              key={stage.key}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}