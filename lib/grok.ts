import { GrokAnalysisResult, GrokTier } from '@/types/grok'
import { getPromptForTier } from './prompts'

export interface GrokAPIError {
  error: string
  code?: string
}

export interface GrokAPIResponse {
  success: boolean
  result?: GrokAnalysisResult
  error?: GrokAPIError
}

/**
 * Calls Grok Vision API for facial analysis
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - Image MIME type
 * @param tier - Analysis tier (free or premium)
 * @returns Typed analysis result or error
 */
export async function analyseWithGrok(
  imageBase64: string,
  mimeType: string,
  tier: GrokTier
): Promise<GrokAPIResponse> {
  try {
    const prompt = getPromptForTier(tier)

    // Prepare the messages for Grok API
    const messages = [
      {
        role: 'system' as const,
        content: prompt.systemPrompt
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: prompt.userPrompt
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: imageBase64,
              detail: 'high' // High detail for facial analysis
            }
          }
        ]
      }
    ]

    // Call Grok API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-vision-beta',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: {
          error: `Grok API error: ${response.status} ${response.statusText}`,
          code: errorData.error?.code
        }
      }
    }

    const data = await response.json()

    if (!data.choices?.[0]?.message?.content) {
      return {
        success: false,
        error: {
          error: 'Invalid response from Grok API: missing content'
        }
      }
    }

    // Parse the JSON response
    let parsed: GrokAnalysisResult
    try {
      parsed = JSON.parse(data.choices[0].message.content)
    } catch (parseError) {
      return {
        success: false,
        error: {
          error: 'Failed to parse Grok API response as JSON'
        }
      }
    }

    // Validate required fields
    const requiredFields = [
      'overallScore', 'symmetryScore', 'goldenRatioScore', 'boneStructureScore',
      'harmonyScore', 'skinScore', 'dimorphismScore', 'percentile', 'category',
      'summary', 'strengths', 'weakestDimension', 'freeTip', 'premiumHook'
    ]

    const missingFields = requiredFields.filter(field => !(field in parsed))
    if (missingFields.length > 0) {
      return {
        success: false,
        error: {
          error: `Missing required fields: ${missingFields.join(', ')}`
        }
      }
    }

    // Validate score ranges
    if (parsed.overallScore < 1.0 || parsed.overallScore > 10.0) {
      return {
        success: false,
        error: {
          error: 'overallScore must be between 1.0 and 10.0'
        }
      }
    }

    const dimensionScores = [
      parsed.symmetryScore, parsed.goldenRatioScore, parsed.boneStructureScore,
      parsed.harmonyScore, parsed.skinScore, parsed.dimorphismScore
    ]

    for (const score of dimensionScores) {
      if (score < 1 || score > 100 || !Number.isInteger(score)) {
        return {
          success: false,
          error: {
            error: 'Dimension scores must be integers between 1 and 100'
          }
        }
      }
    }

    if (parsed.percentile < 1 || parsed.percentile > 99 || !Number.isInteger(parsed.percentile)) {
      return {
        success: false,
        error: {
          error: 'percentile must be an integer between 1 and 99'
        }
      }
    }

    // Validate category
    const validCategories = ['Exceptional', 'Very Attractive', 'Above Average', 'Average', 'Below Average']
    if (!validCategories.includes(parsed.category)) {
      return {
        success: false,
        error: {
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        }
      }
    }

    // Validate premium tips if present
    if (tier === 'premium' && (!parsed.premiumTips || !Array.isArray(parsed.premiumTips) || parsed.premiumTips.length !== 20)) {
      return {
        success: false,
        error: {
          error: 'Premium tier must include exactly 20 premiumTips'
        }
      }
    }

    return {
      success: true,
      result: parsed
    }

  } catch (error) {
    console.error('Grok API call error:', error)
    return {
      success: false,
      error: {
        error: error instanceof Error ? error.message : 'Unknown error calling Grok API'
      }
    }
  }
}

/**
 * Test Grok API connectivity and response format
 * Used for health checks
 */
export async function testGrokAPI(): Promise<{ available: boolean; error?: string }> {
  try {
    // Simple test call without image
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-vision-beta',
        messages: [
          {
            role: 'user',
            content: 'Hello, can you see this message?'
          }
        ],
        max_tokens: 10
      })
    })

    if (response.ok) {
      return { available: true }
    } else {
      return {
        available: false,
        error: `API returned ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}</content>
<parameter name="filePath">/Users/0t41k1/Documents/soundarya/lib/grok.ts