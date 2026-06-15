import { useReveal } from '../lib/useReveal'
import { material } from '../lib/material'
import NotchFrame from './NotchFrame'
import DottedLink from './DottedLink'

const PILLARS = [
  { title: 'Residential', body: 'Low-density estates and townhouse complexes in the country’s best-located suburbs.' },
  { title: 'Commercial', body: 'Office parks designed for the way modern Zimbabwean businesses actually work.' },
  { title: 'Industrial', body: 'Serviced, logistics-ready industrial land on the key freight corridors.' },
]

export default function About() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section id="about" ref={ref} className="bg-cream py-24 lg:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Image with the stat card nested into a notch */}
          <div className="reveal order-2 lg:order-1">
            <NotchFrame
              src="/brand/cover.webp"
              alt="A Cardinal Properties development from the air"
              imgClassName="h-[440px] lg:h-[560px]"
              corner="br"
              pocketBg="#f5f0eb"
            >
              <div
                className="material rounded-2xl p-6 text-cream shadow-lg"
                {...material('#75191b', 'satin')}
              >
                <div className="display text-5xl font-medium">2014</div>
                <div className="mt-1 max-w-[10rem] text-[13px] leading-snug text-cream/80">
                  Trusted, delivering across Zimbabwe ever since
                </div>
              </div>
            </NotchFrame>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <div className="reveal">
              <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">
                Why Cardinal
              </span>
              <h2 className="display mt-4 text-[clamp(2rem,4.2vw,3.2rem)] font-medium leading-tight text-ink">
                We sell land we’ve already serviced.
              </h2>
              <p className="mt-5 max-w-md text-[17px] font-light leading-relaxed text-ink-muted">
                Roads, water and drainage go in before the stands go out. It’s why buyers have
                trusted Cardinal with their families’ futures for more than a decade — and why every
                purchase is backed by <DottedLink href="#how">transparent trust accounting</DottedLink>.
              </p>
            </div>

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-cream-dark sm:grid-cols-3">
              {PILLARS.map((p) => (
                <div key={p.title} className="reveal bg-cream px-5 py-6">
                  <h3 className="display text-2xl font-medium text-maroon">{p.title}</h3>
                  <p className="mt-2 text-[13px] font-light leading-relaxed text-ink-muted">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
