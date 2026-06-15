import { useMemo, useState } from 'react'
import { computePlan, formatUSD } from '../lib/finance'

const TERMS = [12, 24, 36]

export default function InstallmentCalculator({ price }: { price: number }) {
  const [depositPct, setDepositPct] = useState(25)
  const [termMonths, setTermMonths] = useState(36)
  const [annualRate, setAnnualRate] = useState(0)

  const plan = useMemo(
    () => computePlan({ price, depositPct, termMonths, annualRate }),
    [price, depositPct, termMonths, annualRate],
  )

  return (
    <div className="rounded-xl border border-cream-dark bg-cream-light p-5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-widest2 text-ink-muted">
          Instalment plan
        </h4>
        <span className="text-[11px] font-medium uppercase tracking-widest text-forest">
          Live estimate
        </span>
      </div>

      {/* Headline */}
      <div className="mt-4 border-b border-cream-dark pb-5">
        <div className="display text-5xl font-medium text-maroon">
          {formatUSD(plan.monthly)}
          <span className="ml-1 font-sans text-base font-normal text-ink-muted">/ month</span>
        </div>
        <div className="mt-1 text-sm text-ink-muted">
          over {termMonths} months, after a {formatUSD(plan.deposit)} deposit
        </div>
      </div>

      {/* Deposit */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <label className="text-ink-soft">Deposit</label>
          <span className="font-medium tabular-nums text-ink">{depositPct}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={60}
          step={5}
          value={depositPct}
          onChange={(e) => setDepositPct(Number(e.target.value))}
          className="mt-3 w-full"
        />
      </div>

      {/* Term */}
      <div className="mt-5">
        <label className="text-sm text-ink-soft">Term</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {TERMS.map((t) => (
            <button
              key={t}
              onClick={() => setTermMonths(t)}
              className={`rounded-lg border py-2 text-sm font-medium transition ${
                termMonths === t
                  ? 'border-maroon bg-maroon text-white'
                  : 'border-cream-dark bg-white text-ink-soft hover:border-maroon/40'
              }`}
            >
              {t} mo
            </button>
          ))}
        </div>
      </div>

      {/* Interest */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <label className="text-ink-soft">Interest (flat p.a.)</label>
          <span className="font-medium tabular-nums text-ink">
            {annualRate === 0 ? 'Interest-free' : `${annualRate}%`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={15}
          step={1}
          value={annualRate}
          onChange={(e) => setAnnualRate(Number(e.target.value))}
          className="mt-3 w-full"
        />
      </div>

      {/* Breakdown */}
      <dl className="mt-5 space-y-1.5 border-t border-cream-dark pt-4 text-sm">
        <Row label="Stand price" value={formatUSD(price)} />
        <Row label="Deposit" value={formatUSD(plan.deposit)} />
        {plan.totalInterest > 0 && <Row label="Total interest" value={formatUSD(plan.totalInterest)} />}
        <Row label="Total payable" value={formatUSD(plan.totalPayable)} strong />
      </dl>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={strong ? 'font-semibold text-ink' : 'tabular-nums text-ink-soft'}>{value}</dd>
    </div>
  )
}
