import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { SitePlanData } from '../lib/plots'

interface Props {
  data: SitePlanData
  center: [number, number]
  selectedId: string | null
  onSelect: (id: string) => void
}

// ~metres represented by one SVG plan unit (tunes the real-world footprint).
const M_PER_UNIT = 1.1

const FILL: Record<string, string> = {
  available: '#10b981',
  reserved: '#c9b27a',
  sold: '#3a3a3a',
}

export default function PlotMap({ data, center, selectedId, onSelect }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // project an (x,y) plan point to [lat,lng] around the centre
  const project = (x: number, y: number): [number, number] => {
    const dxm = (x - data.width / 2) * M_PER_UNIT
    const dym = (y - data.height / 2) * M_PER_UNIT
    const lat = center[0] - dym / 111320
    const lng = center[1] + dxm / (111320 * Math.cos((center[0] * Math.PI) / 180))
    return [lat, lng]
  }

  // A stand's boundary ring as Leaflet [lat,lng] pairs — the real surveyed
  // geometry when supplied (GeoJSON [lng,lat]), else the schematic rectangle.
  const ringOf = (p: (typeof data.plots)[number]): L.LatLngTuple[] =>
    p.geometry && p.geometry.length
      ? p.geometry.map(([lng, lat]) => [lat, lng] as L.LatLngTuple)
      : [
          project(p.x, p.y),
          project(p.x + p.w, p.y),
          project(p.x + p.w, p.y + p.h),
          project(p.x, p.y + p.h),
        ]

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, { scrollWheelZoom: false, zoomControl: true })
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20, attribution: 'Imagery &copy; Esri · Cardinal Properties demo' },
    ).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // fit to the plan footprint (real geometry if present)
    const all = data.plots.flatMap((p) => ringOf(p))
    map.fitBounds(L.latLngBounds(all).pad(0.08), { maxZoom: 20 })

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, center])

  // (re)draw polygons on status / selection change
  useEffect(() => {
    const group = layerRef.current
    if (!group) return
    group.clearLayers()
    for (const p of data.plots) {
      const selected = p.id === selectedId
      const interactive = p.status === 'available'
      const poly = L.polygon(ringOf(p), {
        color: selected ? '#ffffff' : '#f4e04d', // surveyed boundary in yellow, white when selected
        weight: selected ? 3 : 0.8,
        fillColor: selected ? '#75191b' : FILL[p.status],
        fillOpacity: selected ? 0.6 : p.status === 'sold' ? 0.32 : 0.5,
      })
      poly.bindTooltip(`${p.n} · ${p.status}`, { direction: 'top', sticky: true })
      if (interactive) poly.on('click', () => onSelectRef.current(p.id))
      poly.addTo(group)
    }
  }, [data, selectedId])

  // pan to the selected plot
  useEffect(() => {
    if (!mapRef.current || !selectedId) return
    const p = data.plots.find((x) => x.id === selectedId)
    if (p) {
      const ring = ringOf(p)
      const c: L.LatLngTuple = [
        ring.reduce((s, r) => s + r[0], 0) / ring.length,
        ring.reduce((s, r) => s + r[1], 0) / ring.length,
      ]
      mapRef.current.panTo(c, { animate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    // `isolate` + z-0 keeps Leaflet's internal z-indexes (controls/panes reach
    // ~1000) inside this stacking context, so the map can never paint over the
    // fixed nav (z-50) or the reservation modal (z-110).
    <div className="relative isolate z-0 h-[520px] overflow-hidden rounded-2xl border border-cream-dark">
      <div ref={elRef} className="h-full w-full" />
      <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-lg bg-black/55 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-white/90 backdrop-blur">
        Satellite · surveyed boundaries
      </div>
    </div>
  )
}
