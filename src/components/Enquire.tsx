import { useState } from 'react'
import { SealCheck } from '@phosphor-icons/react'
import { useReveal } from '../lib/useReveal'
import { material } from '../lib/material'
import { submitInquiry } from '../lib/erp'

export default function Enquire() {
  const ref = useReveal<HTMLDivElement>()
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', message: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) return
    setState('sending')
    const ok = await submitInquiry({
      ...form,
      kind: 'development',
      development_slug: 'silverbrook',
      development_name: 'Silverbrook Estate',
    })
    setState(ok ? 'done' : 'error')
  }

  return (
    <section id="enquire" ref={ref} className="relative overflow-hidden bg-maroon py-24 text-cream lg:py-32">
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'url(/brand/cover.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="relative z-10 mx-auto grid max-w-content gap-12 px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <div className="reveal">
          <span className="text-[12px] font-medium uppercase tracking-widest2 text-sand">Register your interest</span>
          <h2 className="display mt-4 text-[clamp(2.2rem,4.5vw,3.6rem)] font-medium leading-tight">
            Reserve your stand at Silverbrook.
          </h2>
          <p className="mt-5 max-w-md text-[17px] font-light leading-relaxed text-cream/80">
            Leave your details and our sales team will send you the available stands, current pricing and a payment
            plan tailored to you. No obligation.
          </p>
          <div className="mt-8 space-y-2 text-sm text-cream/80">
            <div>Silverbrook Estate · Ruwa, Harare</div>
            <div>Cardinal Properties (Pvt) Ltd · Est. 2014</div>
          </div>
        </div>

        {state === 'done' ? (
          <div className="reveal flex flex-col items-center justify-center rounded-3xl bg-cream-light p-10 text-center text-ink">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-forest/15 text-forest">
              <SealCheck weight="duotone" size={40} />
            </div>
            <h3 className="display mt-4 text-2xl font-medium">Enquiry received</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
              Thank you, {form.full_name.split(' ')[0] || 'there'}. Our sales team has your details and will be in
              touch shortly.
            </p>
          </div>
        ) : (
          <form className="reveal rounded-3xl bg-cream-light p-7 text-ink lg:p-8" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" placeholder="Tinashe Moyo" value={form.full_name} onChange={set('full_name')} />
              <Field label="Phone" placeholder="+263 …" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="mt-4">
              <Field label="Email" placeholder="you@email.com" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="mt-4">
              <label className="text-[12px] font-medium uppercase tracking-widest text-ink-muted">
                Budget / stand size
              </label>
              <textarea
                rows={3}
                value={form.message}
                onChange={set('message')}
                placeholder="e.g. a 600–800 m² stand, around $25,000, 36-month plan"
                className="mt-2 w-full resize-none rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm outline-none transition focus:border-maroon"
              />
            </div>
            <button
              type="submit"
              disabled={state === 'sending'}
              className="material sweep mt-6 w-full rounded-full py-4 text-sm font-medium uppercase tracking-widest text-white disabled:opacity-60"
              {...material('#75191b', 'gloss')}
            >
              <span>{state === 'sending' ? 'Sending…' : 'Send my enquiry'}</span>
            </button>
            {state === 'error' && (
              <p className="mt-3 text-center text-[12px] text-maroon">
                Couldn’t reach the server — please try again or call us.
              </p>
            )}
            <p className="mt-3 text-center text-[11px] text-ink-muted">
              Goes straight to Cardinal’s sales CRM.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}

function Field({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
}: {
  label: string
  placeholder: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label className="text-[12px] font-medium uppercase tracking-widest text-ink-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm outline-none transition focus:border-maroon"
      />
    </div>
  )
}
