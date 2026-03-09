import type { AnalysisPublic } from '@/types/analysis'

interface ScoreBarProps {
  label: string
  score: number
  maxScore?: number
}

function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{score}/{maxScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface DimensionBarsProps {
  analysis: AnalysisPublic
}

export function DimensionBars({ analysis }: DimensionBarsProps) {
  const dimensions = [
    { label: 'Symmetry', score: analysis.symmetryScore },
    { label: 'Golden Ratio', score: analysis.goldenRatioScore },
    { label: 'Bone Structure', score: analysis.boneStructureScore },
    { label: 'Harmony', score: analysis.harmonyScore },
    { label: 'Skin Quality', score: analysis.skinScore },
    { label: 'Dimorphism', score: analysis.dimorphismScore },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Beauty Dimensions
      </h3>

      <div className="space-y-4">
        {dimensions.map((dimension) => (
          <ScoreBar
            key={dimension.label}
            label={dimension.label}
            score={dimension.score}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Key Strengths</h4>
        <ul className="space-y-1">
          {analysis.strengths.map((strength, index) => (
            <li key={index} className="flex items-start text-sm text-gray-600">
              <span className="text-green-500 mr-2 mt-1">•</span>
              {strength}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Quick Beauty Tip</h4>
        <p className="text-sm text-blue-800">{analysis.freeTip}</p>
      </div>
    </div>
  )
}