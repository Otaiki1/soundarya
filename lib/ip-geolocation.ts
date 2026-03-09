/**
 * IP Geolocation Library
 * Detects country from user's IP address
 * Uses a free geolocation API (ip-api.com)
 */

export interface CountryInfo {
  countryCode: string
  countryName: string
}

/**
 * Get country code and name from IP address
 * Returns country_code (ISO 3166-1 alpha-2) and country_name
 *
 * @param ip - IP address to geolocate
 * @returns Country code and name, or defaults to 'US'
 */
export async function getCountryFromIP(ip: string): Promise<CountryInfo> {
  try {
    // Only process if IP looks valid (not localhost)
    if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') {
      return {
        countryCode: 'US',
        countryName: 'United States', // Default for development
      }
    }

    // Use ip-api.com (free, no auth required)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,country`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`IP API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'success' && data.countryCode && data.country) {
      return {
        countryCode: data.countryCode.slice(0, 2), // Ensure 2-char code
        countryName: data.country,
      }
    }

    // Fallback
    return {
      countryCode: 'US',
      countryName: 'United States',
    }
  } catch (error) {
    console.warn('[Geolocation] Error detecting country:', error)
    // Return default country on error
    return {
      countryCode: 'US',
      countryName: 'United States',
    }
  }
}

/**
 * Extract IP from request headers
 * Handles various proxy setups (Vercel, Cloudflare, etc.)
 */
export function extractIPFromRequest(request: Request): string {
  const headers = request.headers

  // Check common proxy headers in order of precedence
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-client-ip') ||
    'unknown'

  return ip
}
