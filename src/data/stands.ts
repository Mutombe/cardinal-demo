// ---------------------------------------------------------------------------
// Mock Silverbrook Estate master-plan dataset.
//
// Cardinal Properties does not publish stand-level dimensions or pricing on
// their public site, so this is a believable Phase-1 layout generated for the
// prototype. Numbers are realistic for a low-density Ruwa subdivision but are
// placeholder demo data — swap for the surveyed site plan + live CMS feed.
// ---------------------------------------------------------------------------

export type StandStatus = 'available' | 'reserved' | 'sold'

export interface Stand {
  id: string
  block: string
  /** Plot frontage (width) in metres. */
  frontage: number
  /** Plot depth in metres. */
  depth: number
  /** Plot area in square metres. */
  area: number
  /** Asking price in USD. */
  price: number
  status: StandStatus
  premium: boolean
  /** SVG rect, in the 0..1000 × 0..720 plan coordinate space. */
  svg: { x: number; y: number; w: number; h: number }
  /** Geographic position for the Leaflet view. */
  geo: { lat: number; lng: number }
}

// Deterministic hash so status/sizes are stable across reloads.
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000 // 0..1
}

// Geographic anchor: Silverbrook is in Ruwa, ~18 km E of Harare CBD.
const BASE_LAT = -17.889
const BASE_LNG = 31.253
const PLAN_W = 1000
const PLAN_H = 720

function toGeo(x: number, y: number) {
  return {
    lat: +(BASE_LAT - (y / PLAN_H - 0.5) * 0.0135).toFixed(6),
    lng: +(BASE_LNG + (x / PLAN_W - 0.5) * 0.02).toFixed(6),
  }
}

interface BlockSpec {
  letter: string
  x: number
  y: number
  cols: number
  rows: number
}

// Six blocks separated by road reservations. Lower-density bands have larger
// plots; the southern band (E/F) backs onto open space → flagged premium.
const BLOCKS: BlockSpec[] = [
  { letter: 'A', x: 70, y: 70, cols: 6, rows: 2 },
  { letter: 'B', x: 560, y: 70, cols: 6, rows: 2 },
  { letter: 'C', x: 70, y: 300, cols: 5, rows: 2 },
  { letter: 'D', x: 590, y: 300, cols: 5, rows: 2 },
  { letter: 'E', x: 70, y: 520, cols: 6, rows: 1 },
  { letter: 'F', x: 560, y: 520, cols: 6, rows: 1 },
]

const GAP = 6 // gap between plots (road/verge reading)
const CELL_W = 70
const CELL_H = 96

function buildStands(): Stand[] {
  const stands: Stand[] = []

  for (const b of BLOCKS) {
    for (let r = 0; r < b.rows; r++) {
      for (let c = 0; c < b.cols; c++) {
        const index = r * b.cols + c + 1
        const id = `${b.letter}${String(index).padStart(2, '0')}`
        const seed = hash(id)
        const seed2 = hash(id + 'x')

        const x = b.x + c * CELL_W
        const y = b.y + r * CELL_H
        const w = CELL_W - GAP
        const h = CELL_H - GAP

        // Plot dimensions: vary frontage/depth a touch for realism.
        const premium = b.letter === 'E' || b.letter === 'F' || (c === 0 && seed > 0.6)
        const frontage = Math.round((18 + seed * 8) * (premium ? 1.15 : 1))
        const depth = Math.round((26 + seed2 * 12) * (premium ? 1.2 : 1))
        const area = frontage * depth

        // Pricing: base per-sqm rate + premium uplift, rounded to nearest $250.
        const rate = 42 + seed2 * 14 + (premium ? 8 : 0)
        const price = Math.round((area * rate) / 250) * 250

        // Status distribution: ~52% available, ~18% reserved, ~30% sold.
        const status: StandStatus =
          seed < 0.3 ? 'sold' : seed < 0.48 ? 'reserved' : 'available'

        const cx = x + w / 2
        const cy = y + h / 2

        stands.push({
          id,
          block: b.letter,
          frontage,
          depth,
          area,
          price,
          status,
          premium,
          svg: { x, y, w, h },
          geo: toGeo(cx, cy),
        })
      }
    }
  }

  return stands
}

export const STANDS: Stand[] = buildStands()

// Road segments (purely decorative) for the SVG plan, in plan coordinates.
export const ROADS: { x: number; y: number; w: number; h: number }[] = [
  { x: 0, y: 250, w: PLAN_W, h: 26 }, // primary spine
  { x: 0, y: 478, w: PLAN_W, h: 22 },
  { x: 500, y: 0, w: 22, h: PLAN_H }, // central avenue
]

export const PLAN_VIEWBOX = { w: PLAN_W, h: PLAN_H }
export const GEO_CENTER: [number, number] = [BASE_LAT, BASE_LNG]

export interface EstateSummary {
  total: number
  available: number
  reserved: number
  sold: number
  priceFrom: number
  areaFrom: number
  areaTo: number
}

export function summarise(stands: Stand[]): EstateSummary {
  const available = stands.filter((s) => s.status === 'available')
  return {
    total: stands.length,
    available: available.length,
    reserved: stands.filter((s) => s.status === 'reserved').length,
    sold: stands.filter((s) => s.status === 'sold').length,
    priceFrom: Math.min(...available.map((s) => s.price)),
    areaFrom: Math.min(...stands.map((s) => s.area)),
    areaTo: Math.max(...stands.map((s) => s.area)),
  }
}
