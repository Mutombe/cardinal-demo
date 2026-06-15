import { useEffect, useRef, useState } from 'react'
import { X, ArrowRight, ArrowLeft, SealCheck, PenNib, Check } from '@phosphor-icons/react'
import type { Plot } from '../lib/plots'
import { formatUSD, formatNumber } from '../lib/finance'
import { material } from '../lib/material'

interface Props {
  devName: string
  unit: string // 'stand' | 'home' | …
  plot: Plot
  onClose: () => void
  onComplete?: () => void
}

const STEPS = ['Review', 'Details', 'Sign', 'Done']

export default function ReservationModal({ devName, unit, plot, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    fullName: '',
    nationalId: '',
    email: '',
    phone: '',
    address: '',
    payment: '36-month instalments',
    agent: '',
  })
  const [signed, setSigned] = useState(false)
  const [agree, setAgree] = useState(false)
  const [ref] = useState(() => `CRD-${plot.n}-${Math.floor(1000 + Math.random() * 9000)}`)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const deposit = Math.round((plot.price * 0.25) / 50) * 50
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const emailOk = /.+@.+\..+/.test(form.email)
  const canDetails = form.fullName.trim().length > 1 && emailOk
  const canSubmit = signed && agree

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-cream-light shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-cream-dark px-6 py-5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-widest2 text-maroon">{devName}</div>
            <h3 className="display text-2xl font-medium text-ink">
              Reserve {unit} {plot.n}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-cream-dark text-ink-muted transition hover:border-maroon hover:text-maroon"
          >
            <X weight="duotone" size={18} />
          </button>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-2 px-6 pt-4">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                    i <= step ? 'bg-maroon text-white' : 'bg-cream-dark text-ink-muted'
                  }`}
                >
                  {i < step ? <Check weight="bold" size={12} /> : i + 1}
                </span>
                <span className={`text-[11px] uppercase tracking-widest ${i <= step ? 'text-ink' : 'text-ink-muted'}`}>
                  {s}
                </span>
                {i < 2 && <span className="ml-1 h-px flex-1 bg-cream-dark" />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Fact label={`${unit} no.`} value={`#${plot.n}`} />
                <Fact label="Size" value={`${formatNumber(plot.area)} m²`} />
                <Fact label="Status" value="Available" accent />
              </div>
              <div className="rounded-xl border border-cream-dark bg-white p-4">
                <Row label="Price" value={formatUSD(plot.price)} />
                <Row label="Deposit (25%)" value={formatUSD(deposit)} />
                <Row label="Balance" value={formatUSD(plot.price - deposit)} />
                <Row label="Then ≈ / month · 36 mo" value={formatUSD(Math.round((plot.price - deposit) / 36))} strong />
              </div>
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Reserving holds {unit} {plot.n} in your name. On submission the reservation is logged and the
                {`  ${unit}`} is marked reserved on the live plan — funds post to Cardinal’s trust-accounting ledger.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name *" value={form.fullName} onChange={set('fullName')} placeholder="Tinashe Moyo" />
              <Field label="National ID / Passport" value={form.nationalId} onChange={set('nationalId')} placeholder="63-123456A00" />
              <Field label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" />
              <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="+263 …" />
              <div className="sm:col-span-2">
                <Field label="Residential address" value={form.address} onChange={set('address')} placeholder="Street, suburb, city" />
              </div>
              <div>
                <Label>Payment method</Label>
                <select
                  value={form.payment}
                  onChange={set('payment')}
                  className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm outline-none transition focus:border-maroon"
                >
                  <option>36-month instalments</option>
                  <option>24-month instalments</option>
                  <option>12-month instalments</option>
                  <option>Cash</option>
                </select>
              </div>
              <Field label="Agent / agency (if any)" value={form.agent} onChange={set('agent')} placeholder="Cardinal sales" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <PenNib weight="duotone" className="text-maroon" />
                Sign below to authorise the reservation of {unit} {plot.n}.
              </div>
              <SignaturePad onInk={setSigned} />
              <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-soft">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-maroon"
                />
                I confirm the details above are correct and agree to Cardinal Properties’ reservation terms and
                trust-account payment process.
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-forest/15 text-forest">
                <SealCheck weight="duotone" size={40} />
              </div>
              <h4 className="display mt-4 text-2xl font-medium text-ink">Reservation submitted</h4>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                {unit.charAt(0).toUpperCase() + unit.slice(1)} {plot.n} at {devName} is now held in{' '}
                {form.fullName || 'your name'}. Our team will confirm by email shortly.
              </p>
              <div className="mt-5 rounded-full bg-white px-5 py-2 text-sm ring-1 ring-cream-dark">
                Reference <span className="font-semibold text-maroon">{ref}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-cream-dark px-6 py-4">
          {step === 3 ? (
            <button
              onClick={onClose}
              className="material sweep ml-auto inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-widest text-white"
              {...material('#75191b', 'gloss')}
            >
              <span>Done</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium uppercase tracking-widest text-ink-muted transition hover:text-ink"
              >
                <ArrowLeft weight="duotone" /> {step === 0 ? 'Cancel' : 'Back'}
              </button>
              <button
                disabled={(step === 1 && !canDetails) || (step === 2 && !canSubmit)}
                onClick={() => {
                  if (step === 2) onComplete?.()
                  setStep(step + 1)
                }}
                className="material sweep inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-40"
                {...material('#75191b', 'gloss')}
              >
                <span>{step === 2 ? 'Confirm reservation' : 'Continue'}</span>
                <ArrowRight weight="duotone" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SignaturePad({ onInk }: { onInk: (has: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const inked = useRef(false)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    c.width = rect.width * dpr
    c.height = rect.height * dpr
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a1a1a'
  }, [])

  const at = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: React.PointerEvent) => {
    drawing.current = true
    ref.current!.setPointerCapture(e.pointerId)
    const ctx = ref.current!.getContext('2d')!
    const { x, y } = at(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = ref.current!.getContext('2d')!
    const { x, y } = at(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!inked.current) {
      inked.current = true
      onInk(true)
    }
  }
  const up = () => {
    drawing.current = false
  }
  const clear = () => {
    const c = ref.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    inked.current = false
    onInk(false)
  }

  return (
    <div className="relative">
      <canvas
        ref={ref}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="h-40 w-full touch-none rounded-xl border border-dashed border-ink-muted/40 bg-white"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-3 mx-6 border-b border-ink-muted/30" />
      <button
        onClick={clear}
        className="absolute right-3 top-3 rounded-full bg-cream px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-ink-muted transition hover:text-maroon"
      >
        Clear
      </button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm outline-none transition focus:border-maroon"
      />
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">{children}</label>
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-cream-dark bg-white px-3 py-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</div>
      <div className={`mt-0.5 font-medium ${accent ? 'text-forest' : 'text-ink'}`}>{value}</div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className={strong ? 'font-semibold text-maroon' : 'tabular-nums text-ink'}>{value}</span>
    </div>
  )
}
