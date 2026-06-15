import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Stand, StandStatus } from '../data/stands'
import { GEO_CENTER } from '../data/stands'
import { STATUS_META, SELECTED_STROKE } from '../lib/status'
import { formatUSD } from '../lib/finance'

interface Props {
  stands: Stand[]
  selectedId: string | null
  filter: StandStatus | 'all'
  onSelect: (id: string) => void
}

export default function GeoMap({ stands, selectedId, filter, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: GEO_CENTER, zoom: 16, zoomControl: true })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const group = layerRef.current
    if (!group) return
    group.clearLayers()
    for (const s of stands) {
      if (filter !== 'all' && s.status !== filter) continue
      const meta = STATUS_META[s.status]
      const selected = s.id === selectedId
      const interactive = s.status !== 'sold'
      const marker = L.circleMarker([s.geo.lat, s.geo.lng], {
        radius: selected ? 11 : 7,
        color: selected ? SELECTED_STROKE : meta.stroke,
        weight: selected ? 3 : 1.5,
        fillColor: meta.dot,
        fillOpacity: 0.7,
      })
      marker.bindTooltip(
        `<strong>Stand ${s.id}</strong> · ${s.status === 'sold' ? 'Sold' : formatUSD(s.price)}`,
        { direction: 'top', offset: [0, -6] },
      )
      if (interactive) marker.on('click', () => onSelectRef.current(s.id))
      marker.addTo(group)
    }
  }, [stands, filter, selectedId])

  useEffect(() => {
    if (!mapRef.current || !selectedId) return
    const s = stands.find((x) => x.id === selectedId)
    if (s) mapRef.current.panTo([s.geo.lat, s.geo.lng], { animate: true })
  }, [selectedId, stands])

  return (
    <div className="relative isolate z-0 h-full w-full overflow-hidden rounded-2xl border border-cream-dark">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-5 top-5 z-[500] rounded-lg bg-white/90 px-3 py-1.5 shadow">
        <div className="text-[11px] font-semibold uppercase tracking-widest2 text-maroon">
          Silverbrook Estate
        </div>
        <div className="text-xs text-ink-muted">Ruwa · 18 km from Harare CBD</div>
      </div>
    </div>
  )
}
