// ---------------------------------------------------------------------------
// "Material" surface system — makes a flat brand colour read as a physical,
// lit chip. The look is composed from five layers (see index.css `.material`):
//   1. directional sheen   2. specular hot-spot   3. finish-aware grain
//   4. bevelled edge        5. light-rake sweep on hover
//
// The realism trick: derive the lighter/darker gradient stops FROM the base
// colour with shade(), and scale the highlight intensity by finish type.
// ---------------------------------------------------------------------------

import type { CSSProperties } from 'react'

export type Finish = 'gloss' | 'satin' | 'matt'

/** Lighten (pct > 0) or darken (pct < 0) a hex colour by a percentage. */
export function shade(hex: string, pct: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  const target = pct < 0 ? 0 : 255
  const p = Math.abs(pct) / 100
  r = Math.round((target - r) * p) + r
  g = Math.round((target - g) * p) + g
  b = Math.round((target - b) * p) + b
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// Finish governs how bright/sharp the specular highlight is, and how far the
// sheen lightens at the lit edge.
const HOT: Record<Finish, number> = { gloss: 0.55, satin: 0.34, matt: 0.18 }
const LIGHTEN: Record<Finish, number> = { gloss: 30, satin: 21, matt: 15 }
const DARKEN = -24

export interface MaterialProps {
  'data-finish': Finish
  style: CSSProperties
}

/**
 * Spread onto an element that also carries the `material` class:
 *   <button className="material sweep ..." {...material('#75191b','gloss')}>
 */
export function material(base: string, finish: Finish = 'satin'): MaterialProps {
  return {
    'data-finish': finish,
    style: {
      '--mat-base': base,
      '--mat-light': shade(base, LIGHTEN[finish]),
      '--mat-dark': shade(base, DARKEN),
      '--mat-hot': String(HOT[finish]),
    } as CSSProperties,
  }
}
