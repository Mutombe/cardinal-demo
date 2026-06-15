import type { EstateSummary } from '../data/stands'
import { formatUSD, formatNumber } from '../lib/finance'
import { useReveal } from '../lib/useReveal'

export default function Estate({ summary }: { summary: EstateSummary }) {
  const ref = useReveal<HTMLDivElement>()

  const stats = [
    { value: '18 km', label: 'From Harare CBD' },
    { value: formatNumber(summary.total), label: 'Stands · Phase 1' },
    { value: formatUSD(summary.priceFrom), label: 'Stands from' },
    { value: '36 mo', label: 'Payment terms' },
  ]

  return (
    <section id="estate" ref={ref} className="bg-cream-light py-24 lg:py-36">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="reveal lg:col-span-7">
            <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">
              The Estate
            </span>
            <h2 className="display mt-5 text-[clamp(2.2rem,4.5vw,3.6rem)] font-medium leading-[1.05] text-ink">
              A low-density address taking shape on Harare’s fastest-growing corridor.
            </h2>
          </div>
          <div className="reveal space-y-5 text-[17px] font-light leading-relaxed text-ink-soft lg:col-span-5 lg:pt-3">
            <p>
              Silverbrook sits on the Mutare dual highway in Ruwa — close enough to the city to
              commute, far enough to breathe. Nearly 300 serviced residential units, laid out for
              gracious, low-density living.
            </p>
            <p>
              The roads are tarred. The stormwater drainage is in. This isn’t a plan on paper —
              it’s ground you can stand on today.
            </p>
          </div>
        </div>

        <div className="reveal mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-cream-dark lg:mt-24 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-cream-light px-7 py-8">
              <div className="display text-4xl font-medium text-maroon lg:text-5xl">{s.value}</div>
              <div className="mt-2 text-[12px] font-medium uppercase tracking-widest text-ink-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
