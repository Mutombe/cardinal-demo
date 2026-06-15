import { useReveal } from '../lib/useReveal'

const SHOTS = [
  { src: '/brand/3.webp', caption: 'Tarred internal roads' },
  { src: '/brand/536609097eec4d8bd64ae7e58ddf874b.webp', caption: 'Stone-pitched stormwater drains' },
  { src: '/brand/1.webp', caption: 'Lined channels & culverts' },
  { src: '/brand/2.webp', caption: 'Serviced road reserves' },
]

export default function Gallery() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section id="progress" ref={ref} className="bg-cream-light py-24 lg:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="reveal flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="text-[12px] font-medium uppercase tracking-widest2 text-maroon">
              Progress on site
            </span>
            <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] font-medium leading-tight text-ink">
              Infrastructure first. Promises later.
            </h2>
          </div>
          <p className="max-w-sm text-[15px] font-light leading-relaxed text-ink-muted">
            What buyers usually take on trust, you can see for yourself — roads, drainage and
            services already built into the ground at Silverbrook.
          </p>
        </div>

        <div className="reveal mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SHOTS.map((s, i) => (
            <figure
              key={s.src}
              className={`group relative overflow-hidden rounded-2xl ${
                i === 0 ? 'col-span-2 row-span-2 lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              <img
                src={s.src}
                alt={s.caption}
                loading="lazy"
                className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                  i === 0 ? 'h-64 lg:h-full' : 'h-44 lg:h-52'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <figcaption className="absolute bottom-0 left-0 p-4 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
                {s.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
