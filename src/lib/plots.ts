// ---------------------------------------------------------------------------
// Generates a believable numbered site plan for a development — stands laid out
// in blocks separated by road reservations, each with a number, size, price and
// status. Deterministic from a seed so it's stable across renders.
// ---------------------------------------------------------------------------
import type { Availability, UnitKind } from '../data/developments'

export interface Plot {
  id: string
  n: number
  area: number // m²
  price: number // USD
  status: 'available' | 'reserved' | 'sold'
  x: number
  y: number
  w: number
  h: number
  /** Real surveyed boundary as a GeoJSON-order ring of [lng, lat] pairs.
   *  When present, the satellite map draws this exact shape (road-following)
   *  instead of the schematic grid rectangle. */
  geometry?: [number, number][]
}

export interface SitePlanData {
  plots: Plot[]
  width: number
  height: number
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Plot pitch + block/road layout, in SVG units.
const PITCH_X = 30
const PITCH_Y = 40
const GAP = 3 // gap between plots
const ROAD = 16 // road reservation
const BLOCK_COLS = 6
const BLOCK_ROWS = 4

function sizeFor(kind: UnitKind, r: number): number {
  if (kind === 'plot') return Math.round((300 + r * 700) / 25) * 25 // 300–1000 m²
  if (kind === 'suite') return Math.round((80 + r * 260) / 5) * 5 // 80–340 m²
  return Math.round((180 + r * 320) / 10) * 10 // homes: 180–500 m²
}
function priceFor(kind: UnitKind, area: number, r: number): number {
  if (kind === 'plot') return Math.round((area * (42 + r * 18)) / 250) * 250
  if (kind === 'suite') return Math.round((area * (950 + r * 500)) / 500) * 500
  return Math.round((70000 + r * 130000) / 1000) * 1000 // built homes
}

export function buildSitePlan(seed: string, a: Availability): SitePlanData {
  const total = a.total
  const rng = mulberry32(hash(seed))

  // Status array with exact counts, then deterministically scattered.
  const sold = total - a.available - a.reserved
  const statuses: Plot['status'][] = [
    ...Array(a.available).fill('available'),
    ...Array(a.reserved).fill('reserved'),
    ...Array(sold).fill('sold'),
  ]
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[statuses[i], statuses[j]] = [statuses[j], statuses[i]]
  }

  const base = 2000 + (hash(seed) % 700)
  const cols = Math.max(6, Math.round(Math.sqrt(total * 1.6)))

  const plots: Plot[] = []
  let maxX = 0
  let maxY = 0
  for (let i = 0; i < total; i++) {
    const c = i % cols
    const row = Math.floor(i / cols)
    const x = c * PITCH_X + Math.floor(c / BLOCK_COLS) * ROAD
    const y = row * PITCH_Y + Math.floor(row / BLOCK_ROWS) * ROAD
    const area = sizeFor(a.kind, rng())
    plots.push({
      id: String(base + i),
      n: base + i,
      area,
      price: priceFor(a.kind, area, rng()),
      status: statuses[i],
      x,
      y,
      w: PITCH_X - GAP,
      h: PITCH_Y - GAP,
    })
    maxX = Math.max(maxX, x + PITCH_X)
    maxY = Math.max(maxY, y + PITCH_Y)
  }

  return { plots, width: maxX, height: maxY }
}
