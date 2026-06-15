import type { Stand } from '../data/stands'
import { STATUS_META } from '../lib/status'
import { formatUSD, formatNumber } from '../lib/finance'
import { material } from '../lib/material'
import InstallmentCalculator from './InstallmentCalculator'

interface Props {
  stand: Stand | null
  onClose: () => void
}

export default function StandDetailPanel({ stand, onClose }: Props) {
  if (!stand) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-cream-dark bg-cream-light p-10 text-center">
        <div className="display text-2xl italic text-maroon">Choose your ground</div>
        <p className="mt-3 max-w-xs text-[15px] font-light leading-relaxed text-ink-muted">
          Tap any available stand on the plan to see its exact dimensions and work out your monthly
          instalment — instantly.
        </p>
        <div className="mt-6 flex items-center gap-5 text-xs">
          {(['available', 'reserved', 'sold'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_META[s].dot }} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const meta = STATUS_META[stand.status]

  return (
    <div className="scroll-thin flex h-full animate-fade-up flex-col overflow-y-auto rounded-2xl border border-cream-dark bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest2 text-maroon">
            Block {stand.block}
          </div>
          <h3 className="display text-4xl font-medium text-ink">Stand {stand.id}</h3>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full border border-cream-dark text-ink-muted transition hover:border-maroon hover:text-maroon"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: meta.fill, color: meta.text }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.dot }} />
          {meta.label}
        </span>
        {stand.premium && (
          <span className="rounded-full bg-sand/30 px-3 py-1 text-xs font-medium text-sand-dark">
            Premium · open-space frontage
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Fact label="Frontage" value={`${stand.frontage} m`} />
        <Fact label="Depth" value={`${stand.depth} m`} />
        <Fact label="Area" value={`${formatNumber(stand.area)} m²`} />
      </div>

      <div className="mt-4 flex items-end justify-between rounded-xl bg-cream px-5 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-ink-muted">Price</div>
          <div className="display text-3xl font-medium text-ink">{formatUSD(stand.price)}</div>
        </div>
        <div className="text-right text-xs text-ink-muted">
          {formatUSD(Math.round(stand.price / stand.area))}
          <span className="block">per m²</span>
        </div>
      </div>

      {stand.status === 'reserved' ? (
        <div className="mt-5 rounded-xl border border-sand/50 bg-sand/15 p-4 text-sm text-ink-soft">
          This stand is currently <strong>reserved</strong>. Register your interest and we’ll let
          you know the moment it returns to the market.
        </div>
      ) : (
        <div className="mt-5">
          <InstallmentCalculator price={stand.price} />
        </div>
      )}

      <a
        href="#enquire"
        className="material sweep mt-5 block rounded-full py-3.5 text-center text-sm font-medium uppercase tracking-widest text-white"
        {...material('#75191b', 'gloss')}
      >
        <span>Reserve this stand</span>
      </a>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-muted">
        On reservation, your payment posts straight to Cardinal’s trust-accounting ledger and the
        availability map updates in real time.
      </p>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cream-dark bg-cream-light px-3 py-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</div>
      <div className="display mt-0.5 text-xl font-medium text-ink">{value}</div>
    </div>
  )
}
