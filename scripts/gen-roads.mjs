// Realistic parcels for EVERY development: pull real road centerlines from
// OpenStreetMap (Overpass) near each one, then use Turf to subdivide the road
// frontage into lots (perpendicular cuts → wedges on bends). Lot size varies by
// what the development offers, so each reads as real measurements.
// Run: node scripts/gen-roads.mjs            (all)
//      node scripts/gen-roads.mjs arkenstone (one)
import fs from 'node:fs'
import path from 'node:path'
import * as turf from '@turf/turf'

const ROOT = path.resolve('public/api/developments')
const arg = process.argv[2]
const slugs = arg
  ? [arg]
  : fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, 'stands.json')))

// Lot dimensions (metres) by unit kind — bigger, believable footprints.
const SIZING = {
  plot: { frontage: 36, setback: 8, depth: 55 }, // serviced / industrial stands
  home: { frontage: 28, setback: 7, depth: 40 }, // townhouses, villas, apartments
  suite: { frontage: 32, setback: 8, depth: 46 }, // office suites
}

const ROAD_TYPES = new Set(['residential', 'living_street', 'unclassified', 'tertiary', 'secondary', 'service'])
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function overpass(lat, lng) {
  const query = `[out:json][timeout:25];way["highway"](around:520,${lat},${lng});out geom;`
  for (const url of ENDPOINTS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'cardinal-demo/1.0 (stand mapping POC)',
          Accept: 'application/json',
        },
        body: 'data=' + encodeURIComponent(query),
      })
      const text = await r.text()
      if (r.ok && text.trim().startsWith('{')) return JSON.parse(text)
    } catch {
      /* try next mirror */
    }
  }
  return null
}

function lotsAlong(line, sideSign, dim) {
  const len = turf.length(line, { units: 'meters' })
  const lots = []
  for (let s = 0; s + dim.frontage <= len; s += dim.frontage) {
    const s1 = s + dim.frontage
    const p0 = turf.along(line, s, { units: 'meters' })
    const p1 = turf.along(line, s1, { units: 'meters' })
    const b0 = turf.bearing(p0, turf.along(line, Math.min(s + 2, len), { units: 'meters' }))
    const b1 = turf.bearing(turf.along(line, Math.max(s1 - 2, 0), { units: 'meters' }), p1)
    const perp0 = b0 + 90 * sideSign
    const perp1 = b1 + 90 * sideSign
    const f0 = turf.destination(p0, dim.setback, perp0, { units: 'meters' })
    const f1 = turf.destination(p1, dim.setback, perp1, { units: 'meters' })
    const r0 = turf.destination(p0, dim.setback + dim.depth, perp0, { units: 'meters' })
    const r1 = turf.destination(p1, dim.setback + dim.depth, perp1, { units: 'meters' })
    lots.push([f0, f1, r1, r0].map((pt) => pt.geometry.coordinates.map((n) => +n.toFixed(6))))
  }
  return lots
}

async function buildDev(slug) {
  const file = path.join(ROOT, slug, 'stands.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!data.center) return `${slug}: no center, skipped`
  const [lat, lng] = data.center
  const dim = SIZING[data.unit?.kind] ?? SIZING.plot

  const osm = await overpass(lat, lng)
  if (!osm) return `${slug}: Overpass failed, kept grid`
  const roads = (osm.elements || [])
    .filter((e) => e.type === 'way' && e.geometry && ROAD_TYPES.has(e.tags?.highway))
    .map((e) => turf.lineString(e.geometry.map((g) => [g.lon, g.lat])))
    .filter((l) => turf.length(l, { units: 'meters' }) > 50)
    .sort((a, b) => turf.length(b, { units: 'meters' }) - turf.length(a, { units: 'meters' }))
  if (!roads.length) return `${slug}: no usable roads, kept grid`

  const need = data.stands.length
  const all = []
  for (const road of roads) {
    for (const side of [1, -1]) {
      if (all.length >= need) break
      all.push(...lotsAlong(road, side, dim))
    }
    if (all.length >= need) break
  }
  // Need enough frontage to cover every stand — otherwise keep the clean grid
  // (don't mix a few real lots with grid fallbacks).
  if (all.length < need) return `${slug}: only ${all.length}/${need} lots — kept grid`

  data.stands.forEach((s, i) => {
    if (all[i]) s.geometry = all[i]
    else delete s.geometry
  })
  const used = all.slice(0, need)
  const c = turf.center(turf.featureCollection(used.map((r) => turf.polygon([[...r, r[0]]]))))
  data.center = [+c.geometry.coordinates[1].toFixed(6), +c.geometry.coordinates[0].toFixed(6)]
  fs.writeFileSync(file, JSON.stringify(data))
  return `${slug}: ${Math.min(all.length, need)}/${need} lots on ${roads.length} roads (${data.unit?.kind})`
}

for (const slug of slugs) {
  try {
    console.log(await buildDev(slug))
  } catch (e) {
    console.log(`${slug}: ERROR ${e.message}`)
  }
  await sleep(1500) // be polite to Overpass
}
