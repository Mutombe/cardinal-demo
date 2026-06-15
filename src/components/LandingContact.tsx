import { useReveal } from '../lib/useReveal'

export default function LandingContact() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section id="contact" ref={ref} className="relative overflow-hidden bg-maroon py-24 text-cream lg:py-32">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url(/brand/10e22bbfd0fcf3fa00bf4529f696bd0b.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="reveal relative z-10 mx-auto max-w-3xl px-6 text-center">
        <span className="text-[12px] font-medium uppercase tracking-widest2 text-sand">
          Find your next address
        </span>
        <h2 className="display mt-4 text-[clamp(2.2rem,5vw,3.8rem)] font-medium leading-tight">
          Let’s build your future on solid ground.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] font-light leading-relaxed text-cream/80">
          Browse our developments or talk to our sales team about availability, pricing and payment
          plans across Zimbabwe.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#developments"
            className="rounded-full bg-cream-light px-7 py-3.5 text-sm font-medium uppercase tracking-widest text-maroon transition hover:bg-white"
          >
            Browse developments
          </a>
          <a
            href="mailto:sales@cardinalproperties.co.zw"
            className="rounded-full border border-cream/40 px-7 py-3.5 text-sm font-medium uppercase tracking-widest text-cream transition hover:border-cream hover:bg-cream hover:text-maroon"
          >
            Talk to us
          </a>
        </div>

        <div className="mt-10 text-sm text-cream/70">
          Cardinal Properties (Pvt) Ltd · Harare, Zimbabwe
        </div>
      </div>
    </section>
  )
}
