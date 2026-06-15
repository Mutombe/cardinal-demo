import { useReveal } from '../lib/useReveal'

export default function ImageBreak() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section
      ref={ref}
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-fixed"
      style={{
        backgroundImage: 'url(/brand/10e22bbfd0fcf3fa00bf4529f696bd0b.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-maroon-deep/55" />
      <div className="reveal relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="display text-[clamp(1.8rem,4vw,3.2rem)] font-medium italic leading-tight text-cream">
          “Land is the one asset they aren’t making any more of.”
        </p>
        <div className="mx-auto mt-7 h-px w-16 bg-sand" />
        <p className="mt-5 text-[13px] font-medium uppercase tracking-widest2 text-cream/75">
          Surveyed · Serviced · Title-ready
        </p>
      </div>
    </section>
  )
}
