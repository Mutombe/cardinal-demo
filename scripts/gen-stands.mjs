// Generates CMS-shaped stand data as static JSON endpoints:
//   public/api/developments/<slug>/stands.json
// This mirrors what the CMS/trust-accounting backend would serve. Deterministic
// so the visuals are stable. Run: node scripts/gen-stands.mjs
import fs from 'node:fs'
import path from 'node:path'

// --- availability + geo (kept in sync with src/data/developments.ts) ---------
const AVAILABILITY = {
  silverbrook: { label: 'stands', singular: 'stand', kind: 'plot', total: 287, available: 96, reserved: 41 },
  newport: { label: 'stands', singular: 'stand', kind: 'plot', total: 180, available: 64, reserved: 22 },
  bridgewood: { label: 'stands', singular: 'stand', kind: 'plot', total: 150, available: 58, reserved: 18 },
  northbrook: { label: 'stands', singular: 'stand', kind: 'plot', total: 120, available: 41, reserved: 15 },
  jetway: { label: 'industrial stands', singular: 'stand', kind: 'plot', total: 60, available: 22, reserved: 8 },
  skyport: { label: 'industrial stands', singular: 'stand', kind: 'plot', total: 45, available: 16, reserved: 6 },
  turnpike: { label: 'industrial stands', singular: 'stand', kind: 'plot', total: 70, available: 28, reserved: 10 },
  ironstone: { label: 'industrial stands', singular: 'stand', kind: 'plot', total: 38, available: 13, reserved: 5 },
  arkenstone: { label: 'homes', singular: 'home', kind: 'home', total: 48, available: 12, reserved: 6 },
  'peakwood-village': { label: 'homes', singular: 'home', kind: 'home', total: 36, available: 9, reserved: 4 },
  '100-on-montgomery': { label: 'residences', singular: 'residence', kind: 'home', total: 24, available: 7, reserved: 3 },
  'halcyon-days': { label: 'apartments', singular: 'apartment', kind: 'home', total: 50, available: 18, reserved: 8 },
  'sunbird-villas': { label: 'villas', singular: 'villa', kind: 'home', total: 40, available: 14, reserved: 6 },
  'the-strand': { label: 'office suites', singular: 'suite', kind: 'suite', total: 32, available: 11, reserved: 5 },
}
const GEO = {
  silverbrook: [-17.883, 31.238],
  newport: [-17.889, 31.247], bridgewood: [-19.45, 29.82], northbrook: [-20.1, 28.58],
  arkenstone: [-17.74, 31.11], 'peakwood-village': [-17.81, 31.13], '100-on-montgomery': [-17.795, 31.095],
  'the-strand': [-17.76, 31.09], jetway: [-17.92, 31.095], skyport: [-17.925, 31.1],
  turnpike: [-17.887, 30.699], ironstone: [-17.94, 31.07], 'halcyon-days': [-17.8, 31.07], 'sunbird-villas': [-17.82, 31.06],
}

// --- plot generation (kept in sync with src/lib/plots.ts) --------------------
const PITCH_X = 30, PITCH_Y = 40, GAP = 3, ROAD = 16, BLOCK_COLS = 6, BLOCK_ROWS = 4
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function mulberry32(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function sizeFor(kind, r) {
  if (kind === 'plot') return Math.round((300 + r * 700) / 25) * 25
  if (kind === 'suite') return Math.round((80 + r * 260) / 5) * 5
  return Math.round((180 + r * 320) / 10) * 10
}
function priceFor(kind, area, r) {
  if (kind === 'plot') return Math.round((area * (42 + r * 18)) / 250) * 250
  if (kind === 'suite') return Math.round((area * (950 + r * 500)) / 500) * 500
  return Math.round((70000 + r * 130000) / 1000) * 1000
}
function build(seed, a) {
  const rng = mulberry32(hash(seed))
  const sold = a.total - a.available - a.reserved
  const statuses = [...Array(a.available).fill('available'), ...Array(a.reserved).fill('reserved'), ...Array(sold).fill('sold')]
  for (let i = statuses.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[statuses[i], statuses[j]] = [statuses[j], statuses[i]] }
  const base = 2000 + (hash(seed) % 700)
  const cols = Math.max(6, Math.round(Math.sqrt(a.total * 1.6)))
  const stands = []
  let maxX = 0, maxY = 0
  for (let i = 0; i < a.total; i++) {
    const c = i % cols, row = Math.floor(i / cols)
    const x = c * PITCH_X + Math.floor(c / BLOCK_COLS) * ROAD
    const y = row * PITCH_Y + Math.floor(row / BLOCK_ROWS) * ROAD
    const area = sizeFor(a.kind, rng())
    stands.push({ id: String(base + i), n: base + i, area, price: priceFor(a.kind, area, rng()), status: statuses[i], x, y, w: PITCH_X - GAP, h: PITCH_Y - GAP })
    maxX = Math.max(maxX, x + PITCH_X); maxY = Math.max(maxY, y + PITCH_Y)
  }
  return { stands, width: maxX, height: maxY }
}

// Illustrative "digitized" geometry for a proof-of-concept development: plots
// laid along gently curved roads with varying frontages/depths, so they read as
// real surveyed parcels rather than a grid. (In production this comes from the
// Surveyor-General General Plan / a Shapefile, reprojected to WGS84.)
function genGeometry(center, count) {
  const [lat0, lng0] = center
  const mPerLat = 111320
  const mPerLng = 111320 * Math.cos((lat0 * Math.PI) / 180)
  const rng = mulberry32(hash('geo-' + center.join(',')))

  // Lots fan along a curved road as concentric wedges (cul-de-sac frontage) —
  // the shape you'd get by subdividing road frontage on a bend. Each ring is a
  // road; lots span from the road (inner radius) back to their depth.
  const startA = (200 * Math.PI) / 180 // arc from ~200°…340° → an upper-left fan
  const sweep = (142 * Math.PI) / 180
  const R0 = 58
  const baseDepth = 32
  const roadGap = 12
  const pt = (r, a) => [r * Math.cos(a), r * Math.sin(a)]

  const local = []
  let i = 0
  let k = 0
  while (i < count && k < 14) {
    const R = R0 + k * (baseDepth + roadGap)
    const depth = baseDepth + (rng() - 0.5) * 8
    const nLots = Math.max(3, Math.floor((R * sweep) / (19 + rng() * 6)))
    const dA = sweep / nLots
    for (let j = 0; j < nLots && i < count; j++, i++) {
      const a0 = startA + j * dA
      const a1 = a0 + dA * 0.92 // small gap between lots
      local[i] = [pt(R, a0), pt(R, a1), pt(R + depth, a1), pt(R + depth, a0)]
    }
    k++
  }

  // centre on the bbox, then project local metres → [lng, lat]
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const ring of local)
    for (const [x, y] of ring) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
  const ox = (minX + maxX) / 2
  const oy = (minY + maxY) / 2
  return local.map((ring) =>
    ring.map(([x, y]) => [
      +(lng0 + (x - ox) / mPerLng).toFixed(6),
      +(lat0 - (y - oy) / mPerLat).toFixed(6),
    ]),
  )
}

// Real road-following geometry is added afterwards by gen-roads.mjs (OSM+Turf)
// for every development, so we don't bake synthetic geometry here.
const GEOMETRY_SLUGS = new Set()

const root = path.resolve('public/api/developments')
for (const [slug, a] of Object.entries(AVAILABILITY)) {
  const { stands, width, height } = build(slug, a)
  if (GEOMETRY_SLUGS.has(slug) && GEO[slug]) {
    const rings = genGeometry(GEO[slug], stands.length)
    stands.forEach((s, i) => (s.geometry = rings[i]))
  }
  const payload = {
    slug,
    unit: { label: a.label, singular: a.singular, kind: a.kind },
    total: a.total,
    center: GEO[slug] ?? null,
    width,
    height,
    stands,
  }
  const dir = path.join(root, slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'stands.json'), JSON.stringify(payload))
  console.log(`${slug}: ${stands.length} stands`)
}
