import { useReveal } from '../lib/useReveal'
import { material } from '../lib/material'
import NotchFrame from './NotchFrame'

const STEPS = [
  {
    n: '01',
    title: 'Choose your stand',
    body: 'Browse the live master plan, compare dimensions and lock in the plot that fits your plans — all online, in minutes.',
  },
  {
    n: '02',
    title: 'Reserve & pay',
    body: 'Pay your deposit and instalments securely. Every payment is receipted and ring-fenced the moment it lands.',
  },
  {
    n: '03',
    title: 'We reconcile, automatically',
    body: 'Funds post straight to Cardinal’s trust-accounting ledger and the availability map updates in real time. One source of truth.',
  },
]

export default function HowItWorks() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section id="how" ref={ref} className="bg-cream py-24 lg:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Copy + steps */}
          <div>
            <div className="reveal">
              <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">
                One connected system
              </span>
              <h2 className="display mt-4 text-[clamp(2rem,4.2vw,3.2rem)] font-medium leading-tight text-ink">
                From a click on the map to a balanced trust ledger.
              </h2>
            </div>

            <div className="mt-10 space-y-8">
              {STEPS.map((s) => (
                <div key={s.n} className="reveal flex gap-5">
                  <div className="display shrink-0 text-3xl font-medium text-maroon/40">{s.n}</div>
                  <div>
                    <h3 className="display text-2xl font-medium text-ink">{s.title}</h3>
                    <p className="mt-1.5 max-w-md text-[15px] font-light leading-relaxed text-ink-muted">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="reveal">
            <NotchFrame
              src="/brand/9394ccaf9ebfbe8858b27e6cae8178e2.webp"
              alt="Silverbrook Estate sales office"
              imgClassName="h-[460px] lg:h-[560px]"
              corner="bl"
              pocketBg="#f5f0eb"
            >
              <div
                className="material rounded-2xl p-6 text-cream shadow-lg"
                {...material('#75191b', 'satin')}
              >
                <div className="display text-4xl font-medium">100%</div>
                <div className="mt-1 max-w-[10rem] text-[13px] leading-snug text-cream/80">
                  of buyer funds reconciled to the trust ledger
                </div>
              </div>
            </NotchFrame>
          </div>
        </div>
      </div>
    </section>
  )
}
