import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const CLS =
  'underline decoration-dotted decoration-maroon/45 underline-offset-[5px] transition hover:decoration-maroon hover:text-maroon'

/** Inline body link with a subtle dotted underline. `to` → internal route, `href` → external/mailto. */
export default function DottedLink({
  to,
  href,
  children,
}: {
  to?: string
  href?: string
  children: ReactNode
}) {
  if (to) {
    return (
      <Link to={to} className={CLS}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={CLS} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {children}
    </a>
  )
}
