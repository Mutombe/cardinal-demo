import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export interface NavLink {
  label: string
  href: string
}

interface Props {
  links: NavLink[]
  cta?: { label: string; href: string }
}

const DEFAULT_CTA = { label: 'Enquire', href: '#enquire' }

export default function Nav({ links, cta = DEFAULT_CTA }: Props) {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid
          ? 'bg-maroon/95 py-3 shadow-lg shadow-maroon-deep/20 backdrop-blur'
          : 'bg-gradient-to-b from-black/50 to-transparent py-6'
      }`}
    >
      <div className="mx-auto flex max-w-content items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img src="/brand/logo-white.svg" alt="Cardinal Properties" className="h-7 w-auto" />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium uppercase tracking-widest text-white/80 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href={cta.href}
          className="rounded-full border border-white/40 px-5 py-2 text-[13px] font-medium uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-maroon"
        >
          {cta.label}
        </a>
      </div>
    </header>
  )
}
