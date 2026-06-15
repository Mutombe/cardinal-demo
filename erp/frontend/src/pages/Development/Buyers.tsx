import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Mail, Phone } from 'lucide-react'
import { developmentApi } from '../../services/api'
import {
  Page, PageHeader, Card, Th, Td, Button, Modal, Field, SearchInput, TableSkeleton,
  usePaginated, Pagination,
} from './_kit'

export default function Buyers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    full_name: '', national_id: '', passport_number: '', date_of_birth: '',
    phone: '', email: '', residential_address: '',
    next_of_kin_name: '', next_of_kin_phone: '', next_of_kin_relation: '', notes: '',
  })
  const [error, setError] = useState('')

  const { rows: buyers, count, page, setPage, totalPages, pageSize, isLoading } = usePaginated(
    ['dev-buyers'], developmentApi.buyers.list, { search }
  )

  const create = useMutation({
    mutationFn: () => developmentApi.buyers.create({
      ...form,
      date_of_birth: form.date_of_birth || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dev-buyers'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
      setOpen(false); setError('')
      setForm({
        full_name: '', national_id: '', passport_number: '', date_of_birth: '',
        phone: '', email: '', residential_address: '',
        next_of_kin_name: '', next_of_kin_phone: '', next_of_kin_relation: '', notes: '',
      })
    },
    onError: (e: any) => setError(e?.response?.data ? JSON.stringify(e.response.data) : 'Failed to create'),
  })

  return (
    <Page>
      <PageHeader
        eyebrow="Sales · People"
        title="Buyers"
        subtitle="The buyer register. Buyers link to purchase agreements and ownership profiles (single or joint)."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search buyers…" />
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New buyer</Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-cream-dark bg-cream-light">
              <tr>
                <Th>Buyer</Th>
                <Th>Code</Th>
                <Th>National ID</Th>
                <Th>Contact</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {isLoading && <TableSkeleton cols={4} />}
              {!isLoading && buyers.length === 0 && (
                <tr><Td className="py-10 text-center text-ink-muted">No buyers yet.</Td></tr>
              )}
              {buyers.map((b: any) => (
                <tr key={b.id} className="transition hover:bg-cream-light">
                  <Td className="font-medium text-ink">{b.full_name}</Td>
                  <Td><code className="rounded bg-cream px-1.5 py-0.5 text-xs text-ink-soft">{b.code}</code></Td>
                  <Td>{b.national_id || '—'}</Td>
                  <Td>
                    <div className="flex flex-col gap-0.5 text-xs">
                      {b.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {b.email}</span>}
                      {b.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {b.phone}</span>}
                      {!b.email && !b.phone && '—'}
                    </div>
                  </Td>
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
        title="New buyer"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!form.full_name || create.isPending}>
              {create.isPending ? 'Saving…' : 'Add buyer'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <section className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-700">Identity</h4>
            <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Tinashe Moyo" required />
            <div className="grid grid-cols-2 gap-4">
              <Field label="National ID" value={form.national_id} onChange={(v) => setForm({ ...form, national_id: v })} placeholder="63-1234567A12" />
              <Field label="Passport no." value={form.passport_number} onChange={(v) => setForm({ ...form, passport_number: v })} placeholder="ZN…" />
            </div>
            <Field label="Date of birth" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} type="date" />
          </section>

          <section className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-700">Contact</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+263…" />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="you@email.com" />
            </div>
            <Field label="Residential address" value={form.residential_address} onChange={(v) => setForm({ ...form, residential_address: v })} placeholder="Street, suburb, city" />
          </section>

          <section className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-700">Next of kin</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" value={form.next_of_kin_name} onChange={(v) => setForm({ ...form, next_of_kin_name: v })} />
              <Field label="Relationship" value={form.next_of_kin_relation} onChange={(v) => setForm({ ...form, next_of_kin_relation: v })} placeholder="Spouse" />
            </div>
            <Field label="Next-of-kin phone" value={form.next_of_kin_phone} onChange={(v) => setForm({ ...form, next_of_kin_phone: v })} placeholder="+263…" />
          </section>

          <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Internal notes (optional)" />
          {error && <p className="text-xs text-primary-700">{error}</p>}
        </div>
      </Modal>
    </Page>
  )
}
