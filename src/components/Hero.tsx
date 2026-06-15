import { material } from '../lib/material'

export default function Hero() {
  return (
    <section id="top" className="relative h-screen min-h-[640px] w-full overflow-hidden">
      {/* Cinematic drone footage, with the aerial still as poster/fallback */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/brand/cover.webp"
      >
        <source src="/brand/1080p.mp4" type="video/mp4" />
      </video>

      {/* Legibility gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-r from-maroon-deep/45 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-content flex-col justify-center px-6 lg:px-10">
        <div className="max-w-3xl animate-fade-up">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-sand" />
            <span className="text-[12px] font-medium uppercase tracking-widest2 text-sand">
              Cardinal Properties · Est. 2014
            </span>
          </div>

          <h1 className="display text-[clamp(3rem,8vw,6.5rem)] font-medium leading-[0.95] text-white">
            Silverbrook
            <span className="block italic text-cream/90">Estate</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/85">
            Serviced residential stands in Ruwa — 18&nbsp;kilometres from Harare, on the Mutare
            highway. Tarred roads in. Water and drainage in. Your ground, ready.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#plan"
              className="material sweep group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-medium uppercase tracking-widest text-white"
              {...material('#75191b', 'gloss')}
            >
              <span>Explore the master plan</span>
              <span className="transition group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#estate"
              className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-white/85 transition hover:text-white"
            >
              Discover the estate
            </a>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bob text-white/70">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}
