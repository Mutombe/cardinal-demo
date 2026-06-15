import { useEffect, useMemo, useState } from 'react'
import { CursorClick, MapTrifold, GridFour } from '@phosphor-icons/react'
import type { Plot } from '../lib/plots'
import { formatUSD, formatNumber } from '../lib/finance'
import { useReveal } from '../lib/useReveal'
import { material } from '../lib/material'
import SitePlan from './SitePlan'
import PlotMap from './PlotMap'
import ReservationModal from './ReservationModal'
import { fetchAvailability } from '../lib/erp'

type PlotStatus = 'available' | 'reserved' | 'sold'

// CMS-shaped payload served from /api/developments/<slug>/stands.json
interface StandsPayload {
  slug: string
  unit: { label: string; singular: string; kind: string }
  total: number
  center: [number, number] | null
  width: number
  height: number
  stands: Plot[]
}

export default function AvailabilityShowcase({ slug, name }: { slug: string; name: string }) {
  const [payload, setPayload] = useState<StandsPayload | null>(null)
  const reveal = useReveal<HTMLDivElement>([payload])

  const [reserved, setReserved] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalPlot, setModalPlot] = useState<Plot | null>(null)
  const [view, setView] = useState<'plan' | 'map'>('map')
  // Live status per stand-number, sourced from the ERP dashboard (the CMS).
  const [liveStatus, setLiveStatus] = useState<Record<string, PlotStatus>>({})

  useEffect(() => {
    let live = true
    fetch(`/api/developments/${slug}/stands.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setPayload(d))
      .catch(() => live && setPayload(null))
    return () => {
      live = false
    }
  }, [slug])

  // Pull LIVE availability from the ERP. When this development is managed in the
  // dashboard, its stand statuses (reserve/sell) override the static demo data —
  // so the public map reflects the trust-accounting system in real time.
  useEffect(() => {
    let live = true
    fetchAvailability().then((all) => {
      if (!live) return
      const dev = all[slug]
      if (!dev) return
      const m: Record<string, PlotStatus> = {}
      for (const s of dev.stands) {
        m[s.stand_number] =
          s.status === 'sold' ? 'sold' : s.status === 'reserved' ? 'reserved' : 'available'
      }
      setLiveStatus(m)
    })
    return () => {
      live = false
    }
  }, [slug])

  // Effective plots — live ERP status wins; otherwise locally-reserved ones flip.
  const plots = useMemo<Plot[]>(
    () =>
      payload
        ? payload.stands.map((p) => {
            const live = liveStatus[p.id] ?? liveStatus[String(p.n)]
            if (live) return { ...p, status: live }
            return reserved.has(p.id) ? { ...p, status: 'reserved' } : p
          })
        : [],
    [payload, reserved, liveStatus],
  )
  const counts = useMemo(() => {
    const c = { available: 0, reserved: 0, sold: 0 }
    for (const p of plots) c[p.status]++
    return c
  }, [plots])

  if (!payload) {
    return (
      <section id="availability" className="bg-cream py-20 lg:py-28">
        <div className="mx-auto max-w-content px-6 lg:px-10">
          <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">Availability</span>
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-cream-dark/40" />
        </div>
      </section>
    )
  }

  const unit = payload.unit
  const center = payload.center
  const selected = selectedId ? plots.find((p) => p.id === selectedId && p.status === 'available') ?? null : null
  const data = { plots, width: payload.width, height: payload.height }

  const legend = [
    { c: 'bg-forest', label: 'Available', n: counts.available },
    { c: 'bg-sand', label: 'Reserved', n: counts.reserved },
    { c: 'bg-ink/15', label: 'Sold', n: counts.sold },
  ]
  const pct = (n: number) => `${(n / payload.total) * 100}%`
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <section id="availability" ref={reveal} className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="reveal mb-10 max-w-2xl">
          <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">Availability</span>
          <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] font-medium leading-tight text-ink">
            The live site plan, down to the last {unit.singular}.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            Every numbered {unit.singular} is real-time. Tap a <span className="font-medium text-forest">green</span>{' '}
            {unit.singular} to view it and reserve — paperwork and signature included.
          </p>
        </div>

        <div className="reveal grid gap-10 lg:grid-cols-[minmax(0,330px)_1fr] lg:gap-14">
          {/* Summary + selection */}
          <div>
            <div className="flex items-end gap-3">
              <span className="font-sande text-7xl font-extrabold leading-none text-maroon">{counts.available}</span>
              <span className="mb-2 text-lg text-ink-muted">
                of {payload.total} {unit.label}
                <span className="block text-sm">available now</span>
              </span>
            </div>

            <div className="mt-6 flex h-2.5 w-full overflow-hidden rounded-full bg-cream-dark">
              <div className="bg-forest" style={{ width: pct(counts.available) }} />
              <div className="bg-sand" style={{ width: pct(counts.reserved) }} />
            </div>

            <ul className="mt-5 space-y-2">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-2.5 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${l.c}`} />
                  <span className="text-ink-soft">{l.label}</span>
                  <span className="ml-auto font-medium tabular-nums text-ink">{l.n}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-cream-dark bg-cream-light p-5">
              {selected ? (
                <div className="animate-fade-up">
                  <div className="text-[11px] uppercase tracking-widest text-forest">Selected · available</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-sande text-3xl font-semibold text-ink">
                      {cap(unit.singular)} {selected.n}
                    </span>
                    <span className="text-sm text-ink-muted">{formatNumber(selected.area)} m²</span>
                  </div>
                  <div className="mt-1 display text-2xl text-maroon">{formatUSD(selected.price)}</div>
                  <button
                    onClick={() => setModalPlot(selected)}
                    className="material sweep mt-4 w-full rounded-full py-3 text-sm font-medium uppercase tracking-widest text-white"
                    {...material('#75191b', 'gloss')}
                  >
                    <span>Reserve this {unit.singular}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-ink-muted">
                  <CursorClick weight="duotone" size={22} className="shrink-0 text-maroon" />
                  Select an available {unit.singular} on the {view === 'map' ? 'map' : 'plan'} to see its size, price and
                  reserve it.
                </div>
              )}
            </div>
          </div>

          {/* Interactive plan / satellite map */}
          <div>
            {center && (
              <div className="mb-3 flex justify-end">
                <div className="inline-flex rounded-full border border-cream-dark bg-cream-light p-1">
                  {([
                    { id: 'map', label: 'Satellite', Icon: MapTrifold },
                    { id: 'plan', label: 'Site plan', Icon: GridFour },
                  ] as const).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setView(o.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
                        view === o.id ? 'bg-maroon text-white' : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      <o.Icon weight="duotone" size={15} />
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {view === 'map' && center ? (
              <PlotMap data={data} center={center} selectedId={selectedId} onSelect={setSelectedId} />
            ) : (
              <SitePlan data={data} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </div>
        </div>
      </div>

      {modalPlot && (
        <ReservationModal
          devName={name}
          unit={unit.singular}
          plot={modalPlot}
          onClose={() => {
            setModalPlot(null)
            setSelectedId(null)
          }}
          onComplete={() => setReserved((s) => new Set(s).add(modalPlot.id))}
        />
      )}
    </section>
  )
}
