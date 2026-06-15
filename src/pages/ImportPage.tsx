import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { UploadSimple, MapTrifold } from '@phosphor-icons/react'

// Demonstrates CMS ingestion: drop a GeoJSON FeatureCollection of parcel
// polygons (e.g. exported from the Surveyor-General plan / a Shapefile via
// shp→GeoJSON) and the stands render on satellite imagery, road-aligned.
const STATUS_FILL: Record<string, string> = {
  available: '#10b981',
  reserved: '#c9b27a',
  sold: '#3a3a3a',
}

export default function ImportPage() {
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.GeoJSON | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, { center: [-17.74, 31.11], zoom: 15, scrollWheelZoom: false })
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
      attribution: 'Imagery © Esri',
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  function render(geojson: GeoJSON.GeoJsonObject) {
    const map = mapRef.current
    if (!map) return
    if (layerRef.current) layerRef.current.remove()
    const layer = L.geoJSON(geojson, {
      style: (f) => {
        const s = (f?.properties?.status as string) || 'available'
        return { color: '#f4e04d', weight: 0.9, fillColor: STATUS_FILL[s] ?? '#10b981', fillOpacity: 0.5 }
      },
      onEachFeature: (f, l) => {
        const id = f.properties?.number ?? f.properties?.stand ?? f.properties?.id ?? ''
        l.bindTooltip(`${id} · ${f.properties?.status ?? 'available'}`, { sticky: true })
      },
    }).addTo(map)
    layerRef.current = layer
    const b = layer.getBounds()
    if (b.isValid()) map.fitBounds(b.pad(0.1), { maxZoom: 20 })
    let n = 0
    layer.eachLayer(() => n++)
    setCount(n)
  }

  function ingest(raw: string) {
    try {
      const gj = JSON.parse(raw)
      const feats = gj.type === 'FeatureCollection' ? gj.features : gj.type === 'Feature' ? [gj] : []
      const polys = feats.filter(
        (f: GeoJSON.Feature) => f.geometry && /Polygon/.test(f.geometry.type),
      )
      if (!polys.length) throw new Error('No polygon features found')
      render({ type: 'FeatureCollection', features: polys } as GeoJSON.GeoJsonObject)
      setMsg({ ok: true, text: `Imported ${polys.length} parcels.` })
    } catch (e) {
      setMsg({ ok: false, text: `Could not parse GeoJSON: ${(e as Error).message}` })
    }
  }

  async function loadSample() {
    const d = await fetch('/api/developments/arkenstone/stands.json').then((r) => r.json())
    const features = d.stands
      .filter((s: { geometry?: number[][] }) => s.geometry)
      .map((s: { n: number; status: string; geometry: number[][] }) => ({
        type: 'Feature',
        properties: { number: s.n, status: s.status },
        geometry: { type: 'Polygon', coordinates: [[...s.geometry, s.geometry[0]]] },
      }))
    ingest(JSON.stringify({ type: 'FeatureCollection', features }))
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => ingest(String(reader.result))
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-cream-light">
      <header className="border-b border-cream-dark bg-maroon">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/">
            <img src="/brand/logo-white.svg" alt="Cardinal Properties" className="h-7 w-auto" />
          </Link>
          <span className="text-[12px] font-medium uppercase tracking-widest2 text-cream/80">CMS · Stand import</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-content gap-8 px-6 py-10 lg:grid-cols-[360px_1fr] lg:px-10">
        <div>
          <h1 className="display text-3xl font-medium text-ink">Import surveyed parcels</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            Drop a <strong>GeoJSON</strong> of parcel polygons (export the Surveyor-General plan / a Shapefile to
            GeoJSON, WGS84). Each polygon becomes a stand; <code>number</code> and <code>status</code> properties are
            read if present.
          </p>

          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-maroon/40 bg-white px-4 py-6 text-sm font-medium text-maroon transition hover:bg-maroon/5">
            <UploadSimple weight="duotone" size={20} />
            Choose a .geojson file
            <input type="file" accept=".geojson,.json,application/geo+json,application/json" className="hidden" onChange={onFile} />
          </label>

          <button
            onClick={loadSample}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm font-medium text-ink-soft transition hover:border-maroon/40"
          >
            <MapTrifold weight="duotone" size={18} /> Load Arkenstone sample
          </button>

          {msg && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                msg.ok ? 'bg-forest/10 text-forest' : 'bg-maroon/10 text-maroon'
              }`}
            >
              {msg.text}
            </div>
          )}
          {count > 0 && (
            <div className="mt-3 text-sm text-ink-muted">
              <span className="font-sande text-2xl font-semibold text-maroon">{count}</span> parcels on the map.
            </div>
          )}

          <details className="mt-6 text-[13px] text-ink-muted">
            <summary className="cursor-pointer font-medium text-ink-soft">Expected format</summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/90 p-3 text-[11px] leading-relaxed text-cream">{`{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "properties": { "number": 2541, "status": "available" },
    "geometry": { "type": "Polygon",
      "coordinates": [[[31.11,-17.74], …]] }
  }]
}`}</pre>
          </details>
        </div>

        <div className="relative isolate z-0 h-[640px] overflow-hidden rounded-2xl border border-cream-dark">
          <div ref={mapEl} className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}
