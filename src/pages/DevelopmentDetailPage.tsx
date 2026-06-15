import { useEffect, useRef, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import {
  MapPin,
  Buildings,
  SealCheck,
  CalendarBlank,
  ArrowLeft,
  ArrowUpRight,
  Play,
  X,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { DEVELOPMENTS, galleryUrls, availabilityFor } from '../data/developments'
import Nav, { type NavLink } from '../components/Nav'
import Footer from '../components/Footer'
import AvailabilityShowcase from '../components/AvailabilityShowcase'
import DottedLink from '../components/DottedLink'
import { material } from '../lib/material'
import { useReveal } from '../lib/useReveal'

export default function DevelopmentDetailPage() {
  const { slug } = useParams()
  const dev = DEVELOPMENTS.find((d) => d.slug === slug)
  const reveal = useReveal<HTMLDivElement>()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!dev) return <Navigate to="/" replace />

  const gallery = galleryUrls(dev)
  const cover = dev.image
  const availability = availabilityFor(dev.slug)

  const links: NavLink[] = [
    { label: 'Overview', href: '#overview' },
    ...(availability ? [{ label: 'Availability', href: '#availability' }] : []),
    ...(gallery.length ? [{ label: 'Gallery', href: '#gallery' }] : []),
    { label: 'Enquire', href: '#enquire' },
  ]

  const facts = [
    { icon: MapPin, label: 'Location', value: dev.location },
    { icon: Buildings, label: 'Type', value: dev.type },
    { icon: SealCheck, label: 'Status', value: dev.status },
    { icon: CalendarBlank, label: 'Payment', value: 'Flexible plans available' },
  ]

  return (
    <div className="overflow-x-hidden">
      <Nav links={links} cta={{ label: 'Enquire', href: '#enquire' }} />

      {/* Hero — always the cover still (the source videos carry their own baked
          branding, so they live as a player in the gallery, not behind the title) */}
      <section className="relative h-[88vh] min-h-[600px] w-full overflow-hidden">
        <img src={cover} alt={dev.name} className="absolute inset-0 h-full w-full animate-ken-burns object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon-deep/45 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-content flex-col justify-end px-6 pb-16 lg:px-10 lg:pb-20">
          <Link
            to="/#developments"
            className="group mb-auto mt-28 inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-widest text-white/85 transition hover:text-white"
          >
            <ArrowLeft weight="duotone" className="transition group-hover:-translate-x-0.5" />
            All developments
          </Link>

          <div className="max-w-3xl animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
              <SealCheck weight="duotone" /> {dev.status}
            </span>
            <h1 className="font-sande mt-4 text-[clamp(2.8rem,8vw,6rem)] font-extrabold leading-[0.92] text-white">
              {dev.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/85">
              <span className="inline-flex items-center gap-2 text-sm">
                <MapPin weight="duotone" className="text-sand" /> {dev.location}
              </span>
              <span className="inline-flex items-center gap-2 text-sm">
                <Buildings weight="duotone" className="text-sand" /> {dev.type}
              </span>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#enquire"
                className="material sweep group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-medium uppercase tracking-widest text-white"
                {...material('#75191b', 'gloss')}
              >
                <span>Enquire now</span>
                <ArrowUpRight weight="duotone" className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              {gallery.length > 0 && (
                <a
                  href="#gallery"
                  className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-white/85 transition hover:text-white"
                >
                  View gallery
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Facts + overview */}
      <section id="overview" ref={reveal} className="bg-cream-light py-20 lg:py-28">
        <div className="mx-auto max-w-content px-6 lg:px-10">
          {/* Facts */}
          <div className="reveal grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-cream-dark lg:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start gap-3 bg-cream-light px-5 py-6">
                <f.icon weight="duotone" className="mt-0.5 shrink-0 text-maroon" size={22} />
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-ink-muted">{f.label}</div>
                  <div className="mt-0.5 font-medium text-ink">{f.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Overview copy + logo */}
          <div className="mt-16 grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="reveal lg:col-span-7">
              <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">Overview</span>
              <h2 className="display mt-4 text-[clamp(2rem,4vw,3rem)] font-medium leading-tight text-ink">
                {dev.blurb}
              </h2>
              <p className="mt-5 max-w-xl text-[17px] font-light leading-relaxed text-ink-muted">
                Like every Cardinal development, <span className="font-sande font-semibold text-ink">{dev.name}</span> is
                serviced before it is sold — and every purchase is backed by the same{' '}
                <DottedLink to="/developments/silverbrook#how">transparent trust accounting</DottedLink> that has earned{' '}
                <DottedLink to="/">Cardinal Properties</DottedLink> its reputation since 2014.
              </p>
            </div>
            {dev.logo && (
              <div className="reveal flex items-center justify-center rounded-2xl border border-cream-dark bg-white p-10 lg:col-span-5">
                <img src={dev.logo} alt={`${dev.name} logo`} className="max-h-28 max-w-[80%] object-contain" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Availability — adaptive to what the development offers */}
      {availability && <AvailabilityShowcase slug={dev.slug} name={dev.name} />}

      {/* Gallery (+ video feature) */}
      {(gallery.length > 0 || dev.video) && (
        <Gallery
          name={dev.name}
          images={gallery}
          video={dev.video ? `/developments/${dev.slug}/video.mp4` : undefined}
          poster={cover}
        />
      )}

      {/* Enquire CTA */}
      <section id="enquire" className="relative overflow-hidden bg-maroon py-24 text-cream lg:py-28">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <span className="text-[12px] font-medium uppercase tracking-widest2 text-sand">Register your interest</span>
          <h2 className="mt-4 text-[clamp(2rem,5vw,3.4rem)] leading-tight">
            <span className="font-light">Enquire about </span>
            <span className="font-sande font-semibold">{dev.name}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] font-light leading-relaxed text-cream/80">
            Tell our sales team what you’re looking for and we’ll send availability, pricing and a payment plan tailored
            to you.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`mailto:sales@cardinalproperties.co.zw?subject=${encodeURIComponent(`Enquiry — ${dev.name}`)}`}
              className="material sweep inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-medium uppercase tracking-widest text-white"
              {...material('#5a1315', 'gloss')}
            >
              <span>Talk to our team</span>
              <ArrowUpRight weight="duotone" />
            </a>
            <Link
              to="/#developments"
              className="inline-flex items-center gap-2 rounded-full border border-cream/40 px-7 py-3.5 text-sm font-medium uppercase tracking-widest text-cream transition hover:border-cream hover:bg-cream hover:text-maroon"
            >
              <ArrowLeft weight="duotone" /> All developments
            </Link>
          </div>
        </div>
      </section>

      <Footer links={[{ label: 'Developments', href: '/#developments' }, { label: 'About', href: '/#about' }, { label: 'Contact', href: '/#contact' }]} />
    </div>
  )
}

function VideoFeature({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const start = () => {
    setPlaying(true)
    ref.current?.play()
  }

  return (
    <div className="reveal group relative mb-4 overflow-hidden rounded-2xl border border-cream-dark">
      <video
        ref={ref}
        className="h-[260px] w-full object-cover sm:h-[340px] lg:h-[420px]"
        src={src}
        poster={poster}
        controls={playing}
        preload="none"
        playsInline
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <button
          onClick={start}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 to-black/10 transition hover:from-black/50"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-maroon/90 text-white shadow-xl ring-1 ring-white/40 backdrop-blur transition duration-300 group-hover:scale-110">
            <Play weight="duotone" size={32} className="ml-1" />
          </span>
        </button>
      )}
    </div>
  )
}

function Gallery({
  name,
  images,
  video,
  poster,
}: {
  name: string
  images: string[]
  video?: string
  poster?: string
}) {
  const reveal = useReveal<HTMLDivElement>()
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="gallery" ref={reveal} className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="reveal mb-10">
          <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">Gallery</span>
          <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] font-medium leading-tight text-ink">
            Inside <span className="font-sande font-semibold">{name}</span>
          </h2>
        </div>

        {video && <VideoFeature src={video} poster={poster} />}

        {/* Masonry — each image keeps its natural aspect ratio (no cropping) */}
        <div className="reveal columns-2 gap-3 sm:gap-4 lg:columns-3">
          {images.map((src, i) => (
            <figure key={src} className="group mb-3 break-inside-avoid overflow-hidden rounded-2xl sm:mb-4">
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="block w-full cursor-zoom-in"
                aria-label={`Preview ${name} image ${i + 1}`}
              >
                <img
                  src={src}
                  alt={`${name} — ${i + 1}`}
                  loading="lazy"
                  className="w-full transition duration-700 group-hover:scale-[1.04]"
                />
              </button>
            </figure>
          ))}
        </div>
      </div>

      {open !== null && (
        <Lightbox images={images} index={open} name={name} onClose={() => setOpen(null)} onChange={setOpen} />
      )}
    </section>
  )
}

function Lightbox({
  images,
  index,
  name,
  onClose,
  onChange,
}: {
  images: string[]
  index: number
  name: string
  onClose: () => void
  onChange: (i: number) => void
}) {
  const prev = () => onChange((index - 1 + images.length) % images.length)
  const next = () => onChange((index + 1) % images.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const stop = (e: React.MouseEvent) => e.stopPropagation()
  const btn =
    'grid place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20'

  return (
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-black/92 p-4 backdrop-blur-sm sm:p-10"
      onClick={onClose}
    >
      <button onClick={onClose} aria-label="Close" className={`${btn} absolute right-4 top-4 h-11 w-11`}>
        <X weight="duotone" size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { stop(e); prev() }}
            aria-label="Previous"
            className={`${btn} absolute left-3 top-1/2 h-12 w-12 -translate-y-1/2 sm:left-6`}
          >
            <CaretLeft weight="duotone" size={24} />
          </button>
          <button
            onClick={(e) => { stop(e); next() }}
            aria-label="Next"
            className={`${btn} absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 sm:right-6`}
          >
            <CaretRight weight="duotone" size={24} />
          </button>
        </>
      )}

      <img
        src={images[index]}
        alt={`${name} — ${index + 1}`}
        onClick={stop}
        className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-widest text-white/80 backdrop-blur">
        {index + 1} / {images.length}
      </div>
    </div>
  )
}
