import { useMemo, useState } from 'react'
import { STANDS, type StandStatus } from '../data/stands'
import { STATUS_META } from '../lib/status'
import { useReveal } from '../lib/useReveal'
import MasterPlanMap from './MasterPlanMap'
import GeoMap from './GeoMap'
import StandDetailPanel from './StandDetailPanel'

type View = 'plan' | 'geo'
const ORDER: StandStatus[] = ['available', 'reserved', 'sold']

export default function PlanSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<StandStatus | 'all'>('all')
  const [view, setView] = useState<View>('plan')
  const ref = useReveal<HTMLDivElement>()

  const counts = useMemo(() => {
    const c: Record<StandStatus, number> = { available: 0, reserved: 0, sold: 0 }
    for (const s of STANDS) c[s.status]++
    return c
  }, [])
  const selected = useMemo(() => STANDS.find((s) => s.id === selectedId) ?? null, [selectedId])

  return (
    <section id="plan" ref={ref} className="bg-cream py-24 lg:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        {/* Heading */}
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">
            The Master Plan
          </span>
          <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] font-medium leading-tight text-ink">
            Find your stand. See it. Cost it.
          </h2>
          <p className="mt-4 text-[17px] font-light leading-relaxed text-ink-muted">
            No PDFs, no waiting on a callback. Explore live availability, check exact dimensions and
            calculate your instalments — right here.
          </p>
        </div>

        {/* Controls */}
        <div className="reveal mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
              All stands
            </Chip>
            {ORDER.map((s) => (
              <Chip key={s} active={filter === s} onClick={() => setFilter(filter === s ? 'all' : s)}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_META[s].dot }} />
                {STATUS_META[s].label}
                <span className="tabular-nums text-ink-muted">{counts[s]}</span>
              </Chip>
            ))}
          </div>

          <div className="inline-flex rounded-full border border-cream-dark bg-white p-1">
            {(
              [
                { id: 'plan', label: 'Site Plan' },
                { id: 'geo', label: 'Geo Map' },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                onClick={() => setView(o.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
                  view === o.id ? 'bg-maroon text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map + detail */}
        <div className="reveal mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_392px]">
          <div className="h-[520px] lg:h-[660px]">
            {view === 'plan' ? (
              <MasterPlanMap stands={STANDS} selectedId={selectedId} filter={filter} onSelect={setSelectedId} />
            ) : (
              <GeoMap stands={STANDS} selectedId={selectedId} filter={filter} onSelect={setSelectedId} />
            )}
          </div>
          <div className="h-[520px] lg:h-[660px]">
            <StandDetailPanel stand={selected} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-maroon bg-maroon text-white'
          : 'border-cream-dark bg-white text-ink-soft hover:border-maroon/40'
      }`}
    >
      {children}
    </button>
  )
}
