import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Receipt } from 'lucide-react'
import { developmentApi } from '../../services/api'
import {
  Page, PageHeader, Card, Stat, Th, Td, Button, Modal, Field, SelectField,
  SearchInput, asList, money, TableSkeleton, usePaginated, Pagination,
} from './_kit'

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'ecocash', label: 'EcoCash' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
]

export default function Payments() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ agreement: '', amount: '', method: 'bank_transfer', is_deposit: 'false' })

  const { rows: payments, count, page, setPage, totalPages, pageSize, isLoading } = usePaginated(
    ['dev-payments'], developmentApi.payments.list, { search, filters: { ordering: '-date' } }
  )
  // Accurate portfolio totals come from the dashboard, not just the visible page.
  const { data: dash } = useQuery({
    queryKey: ['development-dashboard'],
    queryFn: () => developmentApi.dashboard().then((r) => r.data),
    staleTime: 60_000,
  })
  const fin = dash?.finance || {}
  const collected = Number(fin.collected || 0)
  const deposits = Number(fin.deposits || 0)

  const { data: agrData } = useQuery({
    queryKey: ['dev-agreements'],
    queryFn: () => developmentApi.agreements.list({ page_size: 200 }).then((r) => r.data),
  })
  const agreements = asList(agrData)

  const create = useMutation({
    mutationFn: () => developmentApi.payments.create({
      agreement: Number(form.agreement),
      amount: Number(form.amount) || 0,
      method: form.method,
      is_deposit: form.is_deposit === 'true',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dev-payments'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
      setOpen(false); setError('')
      setForm({ agreement: '', amount: '', method: 'bank_transfer', is_deposit: 'false' })
    },
    onError: (e: any) => setError(e?.response?.data ? JSON.stringify(e.response.data) : 'Failed to record payment'),
  })

  return (
    <Page>
      <PageHeader
        eyebrow="Finance · Trust"
        title="Payments"
        subtitle="Every payment recorded here is auto-posted to the double-entry ledger (Dr Bank / Cr Stand sales) and applied to the buyer's plan."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search payments…" />
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Record payment</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat tone="maroon" label="Total collected" value={money(collected)} sub={`${count} payments`} />
        <Stat label="Deposits" value={money(deposits)} />
        <Stat label="Installment payments" value={money(Math.max(0, collected - deposits))} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-cream-dark bg-cream-light">
              <tr>
                <Th>Receipt #</Th>
                <Th>Agreement</Th>
                <Th>Date</Th>
                <Th>Method</Th>
                <Th>GL journal</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {isLoading && <TableSkeleton cols={6} />}
              {!isLoading && payments.length === 0 && (
                <tr><Td className="py-10 text-center text-ink-muted">No payments recorded yet.</Td></tr>
              )}
              {payments.map((p: any) => (
                <tr key={p.id} className="cursor-pointer transition hover:bg-cream-light"
                  onClick={() => navigate(`/dashboard/payments/${p.id}`)}>
                  <Td className="font-medium text-ink">{p.payment_number}</Td>
                  <Td>{p.agreement_number}</Td>
                  <Td>{p.date}</Td>
                  <Td className="capitalize">{p.method?.replace(/_/g, ' ')}{p.is_deposit ? ' · deposit' : ''}</Td>
                  <Td>{p.journal_number
                    ? <code className="rounded bg-forest/10 px-1.5 py-0.5 text-xs text-forest">{p.journal_number}</code>
                    : <span className="text-xs text-ink-muted">—</span>}</Td>
                  <Td className="text-right font-medium tabular-nums text-forest">{money(p.amount, p.currency)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPage={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record payment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!form.agreement || !form.amount || create.isPending}>
              {create.isPending ? 'Posting…' : 'Record & post to ledger'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField label="Agreement" value={form.agreement} onChange={(v) => setForm({ ...form, agreement: v })}
            options={[{ value: '', label: 'Select…' }, ...agreements.map((a: any) => ({
              value: String(a.id), label: `${a.agreement_number} · ${a.buyer_name || a.stand_number}`,
            }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (USD)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" placeholder="1000" />
            <SelectField label="Method" value={form.method} onChange={(v) => setForm({ ...form, method: v })} options={METHODS} />
          </div>
          <SelectField label="Type" value={form.is_deposit} onChange={(v) => setForm({ ...form, is_deposit: v })}
            options={[{ value: 'false', label: 'Installment payment' }, { value: 'true', label: 'Deposit' }]} />
          <div className="flex items-start gap-2 rounded-xl bg-cream-light p-3 text-xs text-ink-muted">
            <Receipt className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-700" />
            Posting creates a balanced journal entry and applies the amount to the next due installment automatically.
          </div>
          {error && <p className="text-xs text-primary-700">{error}</p>}
        </div>
      </Modal>
    </Page>
  )
}
