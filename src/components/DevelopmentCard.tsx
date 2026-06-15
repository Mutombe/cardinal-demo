import { Link } from 'react-router-dom'
import { type Development, detailPath } from '../data/developments'

const STATUS_STYLE: Record<Development['status'], string> = {
  'Now selling': 'bg-forest text-white',
  'For sale': 'bg-white/90 text-ink',
  'Coming soon': 'bg-sand text-ink',
}

// Fade the sharp cover's bottom edge to transparent…
const COVER_FADE = 'linear-gradient(to bottom, #000 78%, transparent 100%)'
// …onto a blurred copy of the same image that tints the lower half of the card,
// so the picture's own colour bleeds down into the body (no white seam).
const AMBIENT_MASK = 'linear-gradient(to bottom, transparent 38%, #000 72%)'

export default function DevelopmentCard({ dev }: { dev: Development }) {
  const to = dev.to ?? detailPath(dev.slug)

  return (
    <Link to={to} className="block h-full">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-maroon/5">
        {/* Ambient theme bleed — a blurred copy of the cover tinting the body */}
        <img
          src={dev.image}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-2xl saturate-150"
          style={{ maskImage: AMBIENT_MASK, WebkitMaskImage: AMBIENT_MASK }}
        />

        <div className="relative flex h-full flex-col">
          {/* Media */}
          <div className="relative aspect-[4/3]">
            <img
              src={dev.image}
              alt={dev.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              style={{ maskImage: COVER_FADE, WebkitMaskImage: COVER_FADE }}
            />

            {/* Brand reveal on hover — the development's own logo on a soft veil
                that fades at the bottom (matching the cover) so it bleeds in too */}
            {dev.logo && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cream/95 px-8 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ maskImage: COVER_FADE, WebkitMaskImage: COVER_FADE }}
              >
                <img
                  src={dev.logo}
                  alt={`${dev.name} logo`}
                  className="max-h-20 max-w-[78%] object-contain"
                />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-maroon">
                  View development →
                </span>
              </div>
            )}

            <span
              className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${
                STATUS_STYLE[dev.status]
              }`}
            >
              {dev.status}
            </span>
          </div>

          {/* Body — transparent so the ambient bleed shows through */}
          <div className="relative -mt-4 flex flex-1 flex-col px-5 pb-5">
            <div className="text-[11px] font-medium uppercase tracking-widest text-maroon">
              {dev.type}
            </div>
            <h3 className="font-sande mt-1.5 text-[1.7rem] font-semibold leading-none text-ink">
              {dev.name}
            </h3>
            <div className="mt-2 text-sm text-ink-muted">{dev.location}</div>
            <p className="mt-3 flex-1 text-[14px] font-light leading-relaxed text-ink-soft">
              {dev.blurb}
            </p>

            <div className="mt-4 flex items-center gap-2 text-[13px] font-medium uppercase tracking-widest text-maroon">
              <span className="transition group-hover:mr-1">View development</span>
              <span className="inline-block transition group-hover:translate-x-1">→</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
