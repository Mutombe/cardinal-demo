import { Link } from 'react-router-dom'
import { LockKey } from '@phosphor-icons/react'
import type { NavLink } from './Nav'
import { ERP_LOGIN_URL } from '../lib/erp'

const DEFAULT_LINKS: NavLink[] = [
  { label: 'Developments', href: '/#developments' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
]

export default function Footer({ links = DEFAULT_LINKS }: { links?: NavLink[] }) {
  return (
    <footer className="bg-ink py-14 text-cream/60">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <Link to="/">
            <img src="/brand/logo-white.svg" alt="Cardinal Properties" className="h-7 w-auto opacity-90" />
          </Link>
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] uppercase tracking-widest">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="transition hover:text-cream">
                {l.label}
              </a>
            ))}
            <a
              href={ERP_LOGIN_URL}
              className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-4 py-2 text-cream/90 transition hover:border-cream hover:bg-cream hover:text-ink"
            >
              <LockKey weight="duotone" size={15} /> Staff login
            </a>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Cardinal Properties (Pvt) Ltd · Zimbabwe’s trusted property developer since 2014.</span>
          <span className="text-cream/40">
            Interactive platform prototype · demo data.
          </span>
        </div>
      </div>
    </footer>
  )
}
