import type { AnalysisPublic } from '@/types/analysis'

interface ScoreHeroProps {
  analysis: AnalysisPublic
}

export function ScoreHero({ analysis }: ScoreHeroProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="mb-6">
        <div className="text-7xl font-bold text-blue-600 mb-2">
          {analysis.overallScore.toFixed(1)}
        </div>
        <div className="text-xl text-gray-500 mb-2">out of 10</div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {analysis.category}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-2xl font-semibold text-gray-900 mb-2">
          Top {analysis.percentile}% of Faces
        </div>
        <div className="text-sm text-gray-600">
          Based on analysis of thousands of faces worldwide
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <p className="text-gray-700 leading-relaxed">
          {analysis.summary}
        </p>
      </div>
    </div>
  )
}