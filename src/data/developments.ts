// Cardinal Properties portfolio. Covers + logos are the real brand assets,
// staged under public/developments/<slug>/. Silverbrook is the one with a live
// detail page (the master-plan engine); the rest link there as that template
// gets rolled out.
//
// NOTE: locations/blurbs for Halcyon Days and Sunbird Villas are placeholders —
// they weren't on the public site; confirm copy with Cardinal.

export type Category = 'residential' | 'commercial'

export interface Development {
  slug: string
  name: string
  location: string
  type: string
  category: Category
  status: 'Now selling' | 'For sale' | 'Coming soon'
  blurb: string
  image: string
  logo?: string
  to?: string // internal route; omit → not yet linked
  featured?: boolean
  /** number of staged gallery images (g1.webp … gN.webp); 0 = none */
  gallery?: number
  /** has a staged video.mp4 */
  video?: boolean
}

const base = (slug: string) => `/developments/${slug}`

/** Detail route for any development (Silverbrook has a bespoke page). */
export const detailPath = (slug: string) => `/developments/${slug}`

/** Built gallery image URLs for a development. */
export function galleryUrls(d: Development): string[] {
  if (!d.gallery) return []
  return Array.from({ length: d.gallery }, (_, i) => `${base(d.slug)}/g${i + 1}.webp`)
}

// ---------------------------------------------------------------------------
// Availability — how the inventory is counted differs by what each development
// offers (serviced plots vs. built homes vs. lettable suites), which drives a
// different granular-availability visual on the detail page.
// Counts are realistic demo figures; wire to the trust-accounting backend in
// production. (Cardinal does not publish live availability today.)
// ---------------------------------------------------------------------------
export type UnitKind = 'plot' | 'home' | 'suite'

export interface Availability {
  label: string // plural noun, e.g. 'stands'
  singular: string // e.g. 'stand'
  kind: UnitKind
  total: number
  available: number
  reserved: number
}

export const soldOf = (a: Availability) => a.total - a.available - a.reserved

export const AVAILABILITY: Record<string, Availability> = {
  // Serviced-plot developments
  newport: { label: 'stands', singular: 'stand', kind: 'plot', total: 180, available: 64, reserved: 22 },
  bridgewood: { label: 'stands', singular: 'stand', kind: 'plot', total: 150, available: 58, reserved: 18 },
  northbrook: { label: 'stands', singular: 'stand', kind: 'plot', total: 120, available: 41, reserved: 15 },
  jetway: { label: 'industrial stands', singular: 'stand', kind: 'plot', total: 60, available: 22, reserved: 8 },
  skyport: { label: 'industrial stands', singular: 'stand', kind: 'plot', total: 45, available: 16, reserved: 6 },
  turnpike: { label: 'industrial stands', singular: 'stand', kind: 'plot', total: 70, available: 28, reserved: 10 },
  ironstone: { label: 'industrial stands', singular: 'stand', kind: 'plot', total: 38, available: 13, reserved: 5 },
  // Built-home developments
  arkenstone: { label: 'homes', singular: 'home', kind: 'home', total: 48, available: 12, reserved: 6 },
  'peakwood-village': { label: 'homes', singular: 'home', kind: 'home', total: 36, available: 9, reserved: 4 },
  '100-on-montgomery': { label: 'residences', singular: 'residence', kind: 'home', total: 24, available: 7, reserved: 3 },
  'halcyon-days': { label: 'apartments', singular: 'apartment', kind: 'home', total: 50, available: 18, reserved: 8 },
  'sunbird-villas': { label: 'villas', singular: 'villa', kind: 'home', total: 40, available: 14, reserved: 6 },
  // Lettable suites
  'the-strand': { label: 'office suites', singular: 'suite', kind: 'suite', total: 32, available: 11, reserved: 5 },
}

export const availabilityFor = (slug: string): Availability | undefined => AVAILABILITY[slug]

// Approximate map centre [lat, lng] per development, for the satellite plot view.
// Representative Harare-area coordinates (demo) — replace with surveyed centroids.
export const GEO: Record<string, [number, number]> = {
  newport: [-17.93, 31.18],
  bridgewood: [-19.45, 29.82],
  northbrook: [-20.1, 28.58],
  arkenstone: [-17.74, 31.11],
  'peakwood-village': [-17.81, 31.13],
  '100-on-montgomery': [-17.795, 31.095],
  'the-strand': [-17.76, 31.09],
  jetway: [-17.92, 31.095],
  skyport: [-17.925, 31.1],
  turnpike: [-17.78, 30.78],
  ironstone: [-17.94, 31.07],
  'halcyon-days': [-17.8, 31.07],
  'sunbird-villas': [-17.82, 31.06],
}
export const geoFor = (slug: string): [number, number] | undefined => GEO[slug]

export const DEVELOPMENTS: Development[] = [
  {
    slug: 'silverbrook',
    name: 'Silverbrook Estate',
    location: 'Ruwa · 18 km from Harare CBD',
    type: 'Low-density residential',
    category: 'residential',
    status: 'Now selling',
    blurb:
      'Nearly 300 serviced residential stands on the Mutare highway. Tarred roads and drainage already in the ground.',
    image: '/brand/cover.webp',
    logo: '/brand/silverbrook.svg',
    to: '/developments/silverbrook',
    featured: true,
  },
  {
    slug: 'halcyon-days',
    name: 'Halcyon Days',
    location: 'Harare',
    type: 'Lifestyle apartments',
    category: 'residential',
    status: 'Now selling',
    blurb: 'Turnkey apartments with designer interiors, finished and ready to move into.',
    image: `${base('halcyon-days')}/cover.webp`,
    logo: `${base('halcyon-days')}/logo.png`,
    gallery: 10,
    video: true,
  },
  {
    slug: 'sunbird-villas',
    name: 'Sunbird Villas',
    location: 'Harare',
    type: 'Freestanding villas',
    category: 'residential',
    status: 'Now selling',
    blurb: 'Single-level villas with landscaped gardens in a secure, modern setting.',
    image: `${base('sunbird-villas')}/cover.webp`,
    logo: `${base('sunbird-villas')}/logo.svg`,
    gallery: 10,
  },
  {
    slug: 'arkenstone',
    name: 'Arkenstone',
    location: 'Borrowdale Brooke, Harare',
    type: 'Townhouse complex',
    category: 'residential',
    status: 'For sale',
    blurb: 'Contemporary homes in one of Harare’s most sought-after addresses.',
    image: `${base('arkenstone')}/cover.webp`,
    logo: `${base('arkenstone')}/logo.svg`,
    gallery: 10,
  },
  {
    slug: 'newport',
    name: 'Newport',
    location: 'SA Highway · 22 km from Harare CBD',
    type: 'Mixed-use estate',
    category: 'residential',
    status: 'For sale',
    blurb:
      'A secure, gated mixed-use community on a fast-developing corridor. Flexible terms up to three years.',
    image: `${base('newport')}/cover.webp`,
    logo: `${base('newport')}/logo.png`,
  },
  {
    slug: 'bridgewood',
    name: 'Bridgewood',
    location: 'Gweru',
    type: 'Mixed-use estate',
    category: 'residential',
    status: 'For sale',
    blurb: 'A mixed-use estate bringing modern, planned living to the Midlands.',
    image: `${base('bridgewood')}/cover.webp`,
    logo: `${base('bridgewood')}/logo.svg`,
    gallery: 7,
  },
  {
    slug: 'northbrook',
    name: 'Northbrook Estate',
    location: 'Bulawayo North · 11 km from CBD',
    type: 'Residential estate',
    category: 'residential',
    status: 'For sale',
    blurb: 'Suburban stands in one of Bulawayo’s most established northern corridors.',
    image: `${base('northbrook')}/cover.webp`,
    logo: `${base('northbrook')}/logo.png`,
  },
  {
    slug: 'peakwood-village',
    name: 'Peakwood Village',
    location: 'Greendale, Harare',
    type: 'Townhouse complex',
    category: 'residential',
    status: 'For sale',
    blurb: 'Lock-up-and-go living in leafy, central Greendale.',
    image: `${base('peakwood-village')}/cover.webp`,
    logo: `${base('peakwood-village')}/logo.svg`,
    gallery: 6,
  },
  {
    slug: '100-on-montgomery',
    name: '100 on Montgomery',
    location: 'Highlands, Harare',
    type: 'Townhouse complex',
    category: 'residential',
    status: 'For sale',
    blurb: 'Boutique residences in the heart of Highlands.',
    image: `${base('100-on-montgomery')}/cover.webp`,
    logo: `${base('100-on-montgomery')}/logo.svg`,
    gallery: 6,
  },
  {
    slug: 'the-strand',
    name: 'The Strand Office Park',
    location: 'Borrowdale, Harare',
    type: 'Office park',
    category: 'commercial',
    status: 'For sale',
    blurb: 'Premium office suites off Whitwell Road, built for modern business.',
    image: `${base('the-strand')}/cover.webp`,
    logo: `${base('the-strand')}/logo.svg`,
    gallery: 7,
    video: true,
  },
  {
    slug: 'jetway',
    name: 'Jetway Industrial Park',
    location: 'Airport Road, Harare',
    type: 'Industrial park',
    category: 'commercial',
    status: 'For sale',
    blurb: 'Logistics-ready industrial land minutes from the airport.',
    image: `${base('jetway')}/cover.webp`,
    logo: `${base('jetway')}/logo.svg`,
    gallery: 9,
  },
  {
    slug: 'skyport',
    name: 'Skyport Industrial Park',
    location: 'Airport Road, Harare',
    type: 'Industrial park',
    category: 'commercial',
    status: 'For sale',
    blurb: 'Serviced industrial stands on the city’s key freight corridor.',
    image: `${base('skyport')}/cover.webp`,
    logo: `${base('skyport')}/logo.svg`,
    gallery: 6,
  },
  {
    slug: 'turnpike',
    name: 'Turnpike Industrial Park',
    location: 'Bulawayo Road · 29 km from CBD',
    type: 'Industrial park',
    category: 'commercial',
    status: 'For sale',
    blurb: 'Large-format industrial parcels on the Bulawayo highway.',
    image: `${base('turnpike')}/cover.webp`,
    logo: `${base('turnpike')}/logo.svg`,
    gallery: 8,
  },
  {
    slug: 'ironstone',
    name: 'Ironstone Industrial Park',
    location: 'Seke Road, Harare',
    type: 'Industrial park',
    category: 'commercial',
    status: 'For sale',
    blurb: 'Well-positioned industrial stands on the Seke Road corridor.',
    image: `${base('ironstone')}/cover.webp`,
    logo: `${base('ironstone')}/logo.svg`,
    gallery: 4,
  },
]
