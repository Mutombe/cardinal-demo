import { useMemo, useState } from 'react'
import { DEVELOPMENTS, type Category } from '../data/developments'
import { useReveal } from '../lib/useReveal'
import DevelopmentCard from './DevelopmentCard'

type Filter = 'all' | Category

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial & industrial' },
]

export default function DevelopmentsShowcase() {
  const [filter, setFilter] = useState<Filter>('all')
  const ref = useReveal<HTMLDivElement>()

  const shown = useMemo(
    () => (filter === 'all' ? DEVELOPMENTS : DEVELOPMENTS.filter((d) => d.category === filter)),
    [filter],
  )

  return (
    <section id="developments" ref={ref} className="bg-cream-light py-24 lg:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        {/* Heading */}
        <div className="reveal flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">
              The Portfolio
            </span>
            <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] font-medium leading-tight text-ink">
              Every address. One standard.
            </h2>
            <p className="mt-4 text-[17px] font-light leading-relaxed text-ink-muted">
              From low-density estates to industrial parks — explore where Cardinal is building next.
            </p>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
                  filter === f.id
                    ? 'border-maroon bg-maroon text-white'
                    : 'border-cream-dark bg-white text-ink-soft hover:border-maroon/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="reveal mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((dev) => (
            <DevelopmentCard key={dev.slug} dev={dev} />
          ))}
        </div>
      </div>
    </section>
  )
}
