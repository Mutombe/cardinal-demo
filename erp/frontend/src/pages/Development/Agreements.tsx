import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle2, ListChecks, ChevronDown, Trash2, Users, User } from 'lucide-react'
import { developmentApi } from '../../services/api'
import {
  Page, PageHeader, Card, StatusBadge, Th, Td, Button, Modal, Field, SelectField,
  SearchInput, asList, money, TableSkeleton,
} from './_kit'

type OwnerRow = { buyer: string; percentage: string }

export default function Agreements() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    project: '', stand: '', sale_price: '', deposit_amount: '',
    installment_term_months: '36', payment_frequency: 'monthly',
    agency: '', agent: '',
  })
  const [mode, setMode] = useState<'single' | 'joint'>('single')
  const [buyer, setBuyer] = useState('')
  const [owners, setOwners] = useState<OwnerRow[]>([{ buyer: '', percentage: '100' }])

  const { data, isLoading } = useQuery({
    queryKey: ['dev-agreements'],
    queryFn: () => developmentApi.agreements.list({ page_size: 200 }).then((r) => r.data),
  })
  const agreements = asList(data).filter((a: any) =>
    !search || a.agreement_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.buyer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const { data: projData } = useQuery({ queryKey: ['dev-projects'], queryFn: () => developmentApi.projects.list({ page_size: 200 }).then((r) => r.data) })
  const { data: standData } = useQuery({
    queryKey: ['dev-stands-available', form.project],
    queryFn: () => developmentApi.stands.list({ page_size: 500, project: form.project, status: 'available' }).then((r) => r.data),
    enabled: !!form.project,
  })
  const { data: buyerData } = useQuery({ queryKey: ['dev-buyers'], queryFn: () => developmentApi.buyers.list({ page_size: 300 }).then((r) => r.data) })
  const { data: agencyData } = useQuery({ queryKey: ['dev-agencies'], queryFn: () => developmentApi.agencies.list({ page_size: 200 }).then((r) => r.data) })
  const { data: agentData } = useQuery({ queryKey: ['dev-agents'], queryFn: () => developmentApi.agents.list({ page_size: 300 }).then((r) => r.data) })

  const projects = asList(projData)
  const stands = asList(standData)
  const buyers = asList(buyerData)
  const agencies = asList(agencyData)
  const agents = asList(agentData).filter((a: any) => !form.agency || String(a.agency) === form.agency)

  // Auto-fill sale price from the chosen stand.
  const onStand = (v: string) => {
    const s = stands.find((x: any) => String(x.id) === v)
    setForm((f) => ({ ...f, stand: v, sale_price: s ? String(s.selling_price) : f.sale_price }))
  }

  // Live installment schedule preview.
  const preview = useMemo(() => {
    const sale = Number(form.sale_price) || 0
    const dep = Number(form.deposit_amount) || 0
    const term = Number(form.installment_term_months) || 0
    const bal = Math.max(0, sale - dep)
    if (!term || bal <= 0) return null
    const step = form.payment_frequency === 'quarterly' ? 3 : 1
    const per = bal / term
    return { term, per, bal, dep, sale, step, freq: form.payment_frequency }
  }, [form.sale_price, form.deposit_amount, form.installment_term_months, form.payment_frequency])

  const ownerTotal = owners.reduce((s, o) => s + (Number(o.percentage) || 0), 0)
  const ownersValid = mode === 'single'
    ? !!buyer
    : owners.length > 0 && owners.every((o) => o.buyer) && Math.round(ownerTotal) === 100

  const reset = () => {
    setForm({ project: '', stand: '', sale_price: '', deposit_amount: '', installment_term_months: '36', payment_frequency: 'monthly', agency: '', agent: '' })
    setMode('single'); setBuyer(''); setOwners([{ buyer: '', percentage: '100' }]); setError('')
  }

  const create = useMutation({
    mutationFn: async () => {
      const project = projects.find((p: any) => String(p.id) === form.project)
      const base: any = {
        developer: project?.developer,
        project: Number(form.project),
        stand: Number(form.stand),
        sale_price: Number(form.sale_price) || 0,
        deposit_amount: Number(form.deposit_amount) || 0,
        installment_term_months: Number(form.installment_term_months) || 0,
        payment_frequency: form.payment_frequency,
        agency: form.agency ? Number(form.agency) : null,
        agent: form.agent ? Number(form.agent) : null,
      }
      if (mode === 'single') {
        base.buyer = Number(buyer)
      } else {
        // Create the ownership profile (joint owners), then attach + set primary buyer.
        const shares = owners.map((o, i) => ({
          buyer: Number(o.buyer),
          percentage: Number(o.percentage) || 0,
          is_primary: i === 0,
        }))
        const prof = await developmentApi.ownershipProfiles.create({ shares })
        base.ownership_profile = prof.data.id
        base.buyer = shares[0].buyer
      }
      return developmentApi.agreements.create(base)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dev-agreements'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
      setOpen(false); reset()
    },
    onError: (e: any) => setError(e?.response?.data ? JSON.stringify(e.response.data) : 'Failed to create'),
  })

  const activate = useMutation({
    mutationFn: (id: number) => developmentApi.agreements.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dev-agreements'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
      qc.invalidateQueries({ queryKey: ['dev-stands'] })
    },
  })
  const genSchedule = useMutation({
    mutationFn: (id: number) => developmentApi.agreements.generateSchedule(id),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['dev-installments', id] }),
  })

  return (
    <Page>
      <PageHeader
        eyebrow="Sales · Contracts"
        title="Purchase agreements"
        subtitle="Capture the deal — owners, agency, deposit and plan — then activate to recognise the sale, reserve the stand and generate the installment schedule."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search agreements…" />
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New agreement</Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-cream-dark bg-cream-light">
              <tr>
                <Th></Th><Th>Agreement</Th><Th>Buyer</Th><Th>Stand</Th>
                <Th className="text-right">Sale price</Th><Th className="text-right">Balance</Th>
                <Th>Status</Th><Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {isLoading && <TableSkeleton cols={8} />}
              {!isLoading && agreements.length === 0 && (
                <tr><Td className="py-10 text-center text-ink-muted">No agreements yet.</Td></tr>
              )}
              {agreements.map((a: any) => (
                <AgreementRow key={a.id} a={a} expanded={expanded === a.id}
                  onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
                  onActivate={() => activate.mutate(a.id)}
                  onGenerate={() => genSchedule.mutate(a.id)}
                  activating={activate.isPending} generating={genSchedule.isPending} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => { setOpen(false); reset() }}
        title="New purchase agreement"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!form.project || !form.stand || !ownersValid || create.isPending}>
              {create.isPending ? 'Saving…' : 'Create agreement'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Stand */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-700">Stand</h4>
            <SelectField label="Development" value={form.project} onChange={(v) => setForm({ ...form, project: v, stand: '' })}
              options={[{ value: '', label: 'Select…' }, ...projects.map((p: any) => ({ value: String(p.id), label: p.name }))]} />
            <SelectField label="Stand (available only)" value={form.stand} onChange={onStand}
              options={[{ value: '', label: form.project ? 'Select…' : 'Pick a development first' },
                ...stands.map((s: any) => ({ value: String(s.id), label: `${s.stand_number} · ${money(s.selling_price)}${s.size_sqm ? ` · ${s.size_sqm}m²` : ''}` }))]} />
          </section>

          {/* Ownership */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-700">Ownership</h4>
              <div className="flex rounded-full border border-cream-dark p-0.5">
                <button onClick={() => setMode('single')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${mode === 'single' ? 'bg-primary-700 text-cream' : 'text-ink-muted'}`}>
                  <User className="h-3.5 w-3.5" /> Single
                </button>
                <button onClick={() => setMode('joint')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${mode === 'joint' ? 'bg-primary-700 text-cream' : 'text-ink-muted'}`}>
                  <Users className="h-3.5 w-3.5" /> Joint
                </button>
              </div>
            </div>

            {mode === 'single' ? (
              <SelectField label="Buyer" value={buyer} onChange={setBuyer}
                options={[{ value: '', label: 'Select…' }, ...buyers.map((b: any) => ({ value: String(b.id), label: b.full_name }))]} />
            ) : (
              <div className="space-y-2">
                {owners.map((o, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      <SelectField label={i === 0 ? 'Owner (primary)' : `Owner ${i + 1}`} value={o.buyer}
                        onChange={(v) => setOwners(owners.map((x, j) => j === i ? { ...x, buyer: v } : x))}
                        options={[{ value: '', label: 'Select…' }, ...buyers.map((b: any) => ({ value: String(b.id), label: b.full_name }))]} />
                    </div>
                    <div className="w-24">
                      <Field label="%" value={o.percentage} type="number"
                        onChange={(v) => setOwners(owners.map((x, j) => j === i ? { ...x, percentage: v } : x))} />
                    </div>
                    {owners.length > 1 && (
                      <button onClick={() => setOwners(owners.filter((_, j) => j !== i))}
                        className="mb-2.5 text-ink-muted hover:text-primary-700"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button onClick={() => setOwners([...owners, { buyer: '', percentage: '0' }])}
                    className="text-xs font-medium text-primary-700 hover:underline">+ Add owner</button>
                  <span className={`text-xs font-medium ${Math.round(ownerTotal) === 100 ? 'text-forest' : 'text-primary-700'}`}>
                    Total: {ownerTotal}% {Math.round(ownerTotal) === 100 ? '✓' : '(must be 100)'}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Agency */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-700">Agency (optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Agency" value={form.agency} onChange={(v) => setForm({ ...form, agency: v, agent: '' })}
                options={[{ value: '', label: 'Direct (none)' }, ...agencies.map((a: any) => ({ value: String(a.id), label: a.name }))]} />
              <SelectField label="Agent" value={form.agent} onChange={(v) => setForm({ ...form, agent: v })}
                options={[{ value: '', label: form.agency ? 'Select…' : '—' }, ...agents.map((a: any) => ({ value: String(a.id), label: a.name }))]} />
            </div>
          </section>

          {/* Terms */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-700">Terms</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sale price (USD)" value={form.sale_price} onChange={(v) => setForm({ ...form, sale_price: v })} type="number" />
              <Field label="Deposit (USD)" value={form.deposit_amount} onChange={(v) => setForm({ ...form, deposit_amount: v })} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Term (months)" value={form.installment_term_months} onChange={(v) => setForm({ ...form, installment_term_months: v })} type="number" />
              <SelectField label="Frequency" value={form.payment_frequency} onChange={(v) => setForm({ ...form, payment_frequency: v })}
                options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }]} />
            </div>
          </section>

          {/* Live schedule preview */}
          {preview && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-700">Schedule preview</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold tabular-nums text-ink">{preview.term}</div>
                  <div className="text-[11px] text-ink-muted">{preview.freq} payments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-primary-700">{money(preview.per)}</div>
                  <div className="text-[11px] text-ink-muted">per installment</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-ink">{money(preview.bal)}</div>
                  <div className="text-[11px] text-ink-muted">financed balance</div>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-ink-muted">
                {money(preview.dep)} deposit + {preview.term} × {money(preview.per)} = {money(preview.sale)} sale price
              </p>
            </div>
          )}

          {error && <p className="text-xs text-primary-700">{error}</p>}
        </div>
      </Modal>
    </Page>
  )
}

function AgreementRow({ a, expanded, onToggle, onActivate, onGenerate, activating, generating }: any) {
  const navigate = useNavigate()
  const { data: instData } = useQuery({
    queryKey: ['dev-installments', a.id],
    queryFn: () => developmentApi.installments.list({ agreement: a.id, page_size: 100 }).then((r) => r.data),
    enabled: expanded,
  })
  const installments = asList(instData)

  return (
    <>
      <tr className="transition hover:bg-cream-light">
        <Td>
          <button onClick={onToggle} className="text-ink-muted hover:text-primary-700">
            <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </Td>
        <Td>
          <button onClick={() => navigate(`/dashboard/agreements/${a.id}`)}
            className="font-medium text-ink hover:text-primary-700 hover:underline">
            {a.agreement_number}
          </button>
        </Td>
        <Td>{a.buyer_name || a.ownership?.label || '—'}</Td>
        <Td>{a.stand_number} <span className="text-xs text-ink-muted">· {a.project_name}</span></Td>
        <Td className="text-right tabular-nums">{money(a.sale_price, a.currency)}</Td>
        <Td className="text-right tabular-nums">{money(a.balance, a.currency)}</Td>
        <Td><StatusBadge status={a.status} /></Td>
        <Td>
          <div className="flex items-center justify-end gap-1.5">
            {a.status === 'draft' && (
              <button onClick={onActivate} disabled={activating}
                className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest hover:bg-forest/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Activate
              </button>
            )}
            <button onClick={onGenerate} disabled={generating}
              className="inline-flex items-center gap-1 rounded-full border border-cream-dark px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-primary-300">
              <ListChecks className="h-3.5 w-3.5" /> Schedule
            </button>
          </div>
        </Td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-cream-light px-6 py-4">
            {installments.length === 0 ? (
              <p className="text-sm text-ink-muted">No installments generated yet. Click “Schedule” to build the plan.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-cream-dark bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-cream-light text-xs uppercase tracking-wider text-ink-muted">
                    <tr><Th>#</Th><Th>Due</Th><Th className="text-right">Amount</Th><Th className="text-right">Paid</Th><Th className="text-right">Outstanding</Th><Th>Status</Th></tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark">
                    {installments.map((i: any) => (
                      <tr key={i.id}>
                        <Td>{i.number}</Td>
                        <Td>{i.due_date}</Td>
                        <Td className="text-right tabular-nums">{money(i.amount)}</Td>
                        <Td className="text-right tabular-nums">{money(i.amount_paid)}</Td>
                        <Td className="text-right tabular-nums">{money(i.outstanding)}</Td>
                        <Td><StatusBadge status={i.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
