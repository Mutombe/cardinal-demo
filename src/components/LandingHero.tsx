import { useRef, useState } from 'react'
import { Play, Pause } from '@phosphor-icons/react'
import { material } from '../lib/material'

export default function LandingHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }

  return (
    <section id="top" className="relative h-screen min-h-[640px] w-full overflow-hidden">
      {/* Cardinal showreel — sits in the hero with the estate aerial as its poster.
          It does NOT autoplay; the viewer starts it with the play control (bottom-right). */}
      <video
        ref={videoRef}
        poster="/brand/cover.webp"
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      >
        <source src="/brand/1080p.mp4" type="video/mp4" />
      </video>

      {/* Overlays — lighten once the film is playing so the footage reads. */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80 transition-opacity duration-700 ${
          playing ? 'opacity-40' : 'opacity-100'
        }`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-r from-maroon-deep/50 to-transparent transition-opacity duration-700 ${
          playing ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Editorial copy — fades back while the film plays. */}
      <div
        className={`relative z-10 mx-auto flex h-full max-w-content flex-col justify-center px-6 transition-opacity duration-700 lg:px-10 ${
          playing ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="max-w-3xl animate-fade-up">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-sand" />
            <span className="text-[12px] font-medium uppercase tracking-widest2 text-sand">
              Property developers · Est. 2014
            </span>
          </div>

          <h1 className="display text-[clamp(2.8rem,7vw,6rem)] font-medium leading-[0.98] text-white">
            We build the ground
            <span className="block italic text-cream/90">Zimbabwe grows on.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/85">
            Residential estates, office parks and industrial land across the country — surveyed,
            serviced and sold the modern way. Cardinal Properties, Zimbabwe’s most trusted developer
            since 2014.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#developments"
              className="material sweep group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-medium uppercase tracking-widest text-white"
              {...material('#75191b', 'gloss')}
            >
              <span>Explore developments</span>
              <span className="transition group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#about"
              className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-white/85 transition hover:text-white"
            >
              Why Cardinal
            </a>
          </div>
        </div>
      </div>

      {/* Play / pause control — strategic bottom-right corner. */}
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause showreel' : 'Play showreel'}
        className="group absolute bottom-8 right-6 z-20 inline-flex items-center gap-3 rounded-full border border-white/30 bg-black/30 py-2.5 pl-3 pr-5 text-white backdrop-blur-md transition hover:border-white/60 hover:bg-black/50 lg:right-10"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-maroon transition group-hover:scale-105">
          {playing ? <Pause weight="fill" size={16} /> : <Play weight="fill" size={16} />}
        </span>
        <span className="text-[12px] font-medium uppercase tracking-widest">
          {playing ? 'Pause film' : 'Watch the film'}
        </span>
      </button>

      {/* Scroll cue — hidden while the film plays so it doesn't fight the footage. */}
      {!playing && (
        <div className="absolute bottom-9 left-1/2 z-10 -translate-x-1/2 animate-bob text-white/70">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </div>
      )}
    </section>
  )
}
