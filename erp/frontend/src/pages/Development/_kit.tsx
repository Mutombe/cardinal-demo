import { ReactNode, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

// ---------------------------------------------------------------------------
// Cardinal Development module — shared, brand-consistent UI primitives.
// Editorial identity mirrors the public marketing site: Cormorant Garamond
// display headings, maroon (primary) accents, cream surfaces.
// ---------------------------------------------------------------------------

/** Page header with an editorial serif title + optional eyebrow + actions. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-cream-dark pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <span className="text-[11px] font-semibold uppercase tracking-widest2 text-primary-700">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Soft card surface. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-cream-dark bg-white', className)}>{children}</div>
  )
}

/** Headline statistic, optionally tinted maroon for the hero metric. */
export function Stat({
  label,
  value,
  sub,
  tone = 'plain',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'plain' | 'maroon'
}) {
  const maroon = tone === 'maroon'
  return (
    <div
      className={cn(
        'rounded-2xl border p-5',
        maroon ? 'border-primary-800 bg-primary-700 text-cream' : 'border-cream-dark bg-white'
      )}
    >
      <p
        className={cn(
          'text-[11px] font-semibold uppercase tracking-widest',
          maroon ? 'text-cream/70' : 'text-ink-muted'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-2 text-3xl font-bold tracking-tight tabular-nums',
          maroon ? 'text-cream' : 'text-ink'
        )}
      >
        {value}
      </p>
      {sub && (
        <p className={cn('mt-1.5 text-xs', maroon ? 'text-cream/70' : 'text-ink-muted')}>{sub}</p>
      )}
    </div>
  )
}

const TONES: Record<string, string> = {
  available: 'bg-forest/10 text-forest border-forest/20',
  reserved: 'bg-amber-50 text-amber-700 border-amber-200',
  sold: 'bg-primary-50 text-primary-700 border-primary-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  under_transfer: 'bg-blue-50 text-blue-700 border-blue-200',
  // agreement / inquiry statuses
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  active: 'bg-forest/10 text-forest border-forest/20',
  completed: 'bg-primary-50 text-primary-700 border-primary-200',
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  qualified: 'bg-forest/10 text-forest border-forest/20',
  converted: 'bg-primary-50 text-primary-700 border-primary-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
  now_selling: 'bg-forest/10 text-forest border-forest/20',
}

/** Pill badge keyed by status string. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = TONES[status?.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'
  const text = label || status?.replace(/_/g, ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize',
        tone
      )}
    >
      {text}
    </span>
  )
}

/** Thin maroon progress meter for sell-through. */
export function Meter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-cream-dark', className)}>
      <div
        className="h-full rounded-full bg-primary-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted',
        className
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-sm text-ink-soft', className)}>{children}</td>
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-dark bg-cream-light py-16 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </div>
  )
}

/** Primary maroon action button. */
export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'outline'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const styles = {
    primary: 'bg-primary-700 text-cream hover:bg-primary-800',
    outline: 'border border-primary-700 text-primary-700 hover:bg-primary-50',
    ghost: 'text-ink-muted hover:bg-cream hover:text-ink',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-50',
        styles,
        className
      )}
    >
      {children}
    </button>
  )
}

/** Normalize a DRF list response (array or {results:[]}). */
export function asList<T = any>(data: any): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  return []
}

/** Lightweight centered modal. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:p-8">
      <div className="my-auto w-full max-w-lg rounded-2xl border border-cream-dark bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-cream-dark px-6 py-4">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-cream-dark px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({
  label, value, onChange, type = 'text', placeholder, required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium uppercase tracking-wider text-ink-muted">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-cream-dark bg-cream-light px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary-700 focus:bg-white"
      />
    </label>
  )
}

export function SelectField({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium uppercase tracking-wider text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-cream-dark bg-cream-light px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary-700 focus:bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

/** Search input used in list toolbars. */
export function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Search…'}
      className="w-full rounded-full border border-cream-dark bg-white px-4 py-2 text-sm text-ink outline-none transition focus:border-primary-700 sm:w-64"
    />
  )
}

/** Cream full-bleed page wrapper used by every module page. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-light -m-4 p-4 md:-m-6 md:p-8">
      <div className="mx-auto max-w-content space-y-6">{children}</div>
    </div>
  )
}

/** Shimmer skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-cream-dark/60', className)} />
}

/** Skeleton rows for a table body while data loads. */
export function TableSkeleton({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-cream-dark/50">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className={cn('h-4', c === 0 ? 'w-32' : 'w-16')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Server-side paginated query. Tracks page + (optional) search, hits the DRF
 *  endpoint with ?page/?page_size/?search, and returns the page rows + count.
 *  keepPreviousData keeps the table populated while the next page loads. */
export function usePaginated(
  key: any[],
  fetcher: (params: Record<string, any>) => Promise<{ data: any }>,
  opts: { pageSize?: number; search?: string; filters?: Record<string, any> } = {}
) {
  const { pageSize = 25, search = '', filters = {} } = opts
  const [page, setPage] = useState(1)

  // Reset to page 1 whenever the search/filters change.
  const filterKey = JSON.stringify({ search, filters })
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    if (page !== 1) setPage(1)
  }

  const q = useQuery({
    queryKey: [...key, page, pageSize, filterKey],
    queryFn: () =>
      fetcher({
        page,
        page_size: pageSize,
        ...(search ? { search } : {}),
        ...filters,
      }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  const data: any = q.data
  const rows: any[] = Array.isArray(data) ? data : data?.results ?? []
  const count: number = typeof data?.count === 'number' ? data.count : rows.length
  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return {
    rows, count, page, setPage, totalPages, pageSize,
    isLoading: q.isLoading, isFetching: q.isFetching,
  }
}

/** Prev / next pager with a result range readout. */
export function Pagination({
  page, totalPages, count, pageSize, onPage,
}: {
  page: number; totalPages: number; count: number; pageSize: number; onPage: (p: number) => void
}) {
  if (count === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(count, page * pageSize)
  return (
    <div className="flex items-center justify-between px-1 py-2 text-sm">
      <span className="text-ink-muted">
        Showing <span className="font-medium text-ink">{from}–{to}</span> of{' '}
        <span className="font-medium text-ink">{count}</span>
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-full border border-cream-dark px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-primary-300 disabled:opacity-40">
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <span className="px-2 text-xs text-ink-muted">Page {page} / {totalPages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-full border border-cream-dark px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-primary-300 disabled:opacity-40">
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function money(value: number | string | null | undefined, currency = 'USD') {
  const n = Number(value || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(isNaN(n) ? 0 : n)
}
