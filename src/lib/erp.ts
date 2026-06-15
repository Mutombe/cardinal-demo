// Links the public marketing site to the Cardinal ERP platform.
// The ERP admin app (login/dashboard) and its API run separately; override via
// VITE_ERP_URL / VITE_ERP_API in production.
export const ERP_URL = import.meta.env.VITE_ERP_URL || 'http://localhost:5173'
export const ERP_API = import.meta.env.VITE_ERP_API || 'http://localhost:8000'

export const ERP_LOGIN_URL = `${ERP_URL}/login`

export interface InquiryPayload {
  full_name: string
  email?: string
  phone?: string
  message?: string
  kind?: 'general' | 'development' | 'stand'
  development_slug?: string
  development_name?: string
  stand_number?: string
}

export interface LiveAvailability {
  slug: string
  name: string
  location: string
  status: string
  total: number
  available: number
  reserved: number
  sold: number
  stands: {
    stand_number: string
    status: string
    size_sqm: number | null
    price: number
    currency: string
    lat: number | null
    lng: number | null
  }[]
}

/** Live availability from the ERP (the CMS source of truth). Keyed by slug.
 * Returns {} on failure so callers fall back to static demo data. */
export async function fetchAvailability(): Promise<Record<string, LiveAvailability>> {
  try {
    const res = await fetch(`${ERP_API}/api/development/public/availability/`)
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

/** Submit a website lead into the ERP CRM (public endpoint). */
export async function submitInquiry(payload: InquiryPayload): Promise<boolean> {
  try {
    const res = await fetch(`${ERP_API}/api/development/inquiries/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'website', ...payload }),
    })
    return res.ok
  } catch {
    return false
  }
}
