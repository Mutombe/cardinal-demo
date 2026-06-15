import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { developmentApi } from '../../services/api'
import {
  Page, PageHeader, Card, StatusBadge, Th, Td, Button, Modal, Field, SelectField,
  SearchInput, asList, money, TableSkeleton, usePaginated, Pagination,
} from './_kit'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'under_transfer', label: 'Under transfer' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function Stands() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const projectFilter = params.get('project') || ''
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    project: projectFilter, stand_number: '', size_sqm: '', selling_price: '',
    currency: 'USD', latitude: '', longitude: '', status: 'available', notes: '',
  })
  const [error, setError] = useState('')

  const { data: projData } = useQuery({
    queryKey: ['dev-projects'],
    queryFn: () => developmentApi.projects.list({ page_size: 200 }).then((r) => r.data),
  })
  const projects = asList(projData)

  const { rows: stands, count, page, setPage, totalPages, pageSize, isLoading } = usePaginated(
    ['dev-stands'],
    developmentApi.stands.list,
    {
      search,
      filters: {
        ...(projectFilter ? { project: projectFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
    }
  )

  const create = useMutation({
    mutationFn: () => developmentApi.stands.create({
      project: Number(form.project),
      stand_number: form.stand_number,
      size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
      selling_price: Number(form.selling_price) || 0,
      currency: form.currency,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      status: form.status,
      notes: form.notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dev-stands'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
      setOpen(false); setError('')
      setForm({ project: projectFilter, stand_number: '', size_sqm: '', selling_price: '', currency: 'USD', latitude: '', longitude: '', status: 'available', notes: '' })
    },
    onError: (e: any) => setError(e?.response?.data ? JSON.stringify(e.response.data) : 'Failed to create'),
  })

  const setProjectFilter = (v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set('project', v); else next.delete('project')
    setParams(next)
  }

  const activeProject = projects.find((p: any) => String(p.id) === String(projectFilter))

  return (
    <Page>
      <PageHeader
        eyebrow="Content · CMS · Inventory"
        title="Stands"
        subtitle="The stand register. Status here (available / reserved / sold) is what buyers see on the public availability map."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search stand #…" />
            <Button onClick={() => { setForm({ ...form, project: projectFilter }); setOpen(true) }}>
              <Plus className="h-4 w-4" /> New stand
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-full border border-cream-dark bg-white px-4 py-2 text-sm text-ink outline-none focus:border-primary-700"
        >
          <option value="">All developments</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-1.5">
          {['', ...STATUS_OPTIONS.map((s) => s.value)].map((s) => (
            <button key={s || 'all'} onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                statusFilter === s ? 'bg-primary-700 text-cream' : 'bg-white text-ink-muted border border-cream-dark hover:border-primary-300'
              }`}>
              {s ? s.replace(/_/g, ' ') : 'All'}
            </button>
          ))}
        </div>
        {activeProject && (
          <span className="ml-auto text-sm text-ink-muted">
            {activeProject.name} · <span className="text-ink">{count}</span> stands
          </span>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-cream-dark bg-cream-light">
              <tr>
                <Th>Stand #</Th>
                <Th>Development</Th>
                <Th className="text-right">Size (m²)</Th>
                <Th className="text-right">Price</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {isLoading && <TableSkeleton cols={5} />}
              {!isLoading && stands.length === 0 && (
                <tr><Td className="py-10 text-center text-ink-muted">No stands match.</Td></tr>
              )}
              {stands.map((s: any) => (
                <tr key={s.id} className="cursor-pointer transition hover:bg-cream-light"
                  onClick={() => navigate(`/dashboard/stands/${s.id}`)}>
                  <Td className="font-medium text-ink">{s.stand_number}</Td>
                  <Td>{s.project_name}</Td>
                  <Td className="text-right tabular-nums">{s.size_sqm ? Number(s.size_sqm).toLocaleString() : '—'}</Td>
                  <Td className="text-right tabular-nums">{money(s.selling_price, s.currency)}</Td>
                  <Td><StatusBadge status={s.status} /></Td>
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
        title="New stand"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!form.project || !form.stand_number || create.isPending}>
              {create.isPending ? 'Saving…' : 'Add stand'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField label="Development" value={form.project} onChange={(v) => setForm({ ...form, project: v })}
            options={[{ value: '', label: 'Select…' }, ...projects.map((p: any) => ({ value: String(p.id), label: p.name }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stand number" value={form.stand_number} onChange={(v) => setForm({ ...form, stand_number: v })} placeholder="A-014" required />
            <Field label="Size (m²)" value={form.size_sqm} onChange={(v) => setForm({ ...form, size_sqm: v })} type="number" placeholder="600" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Selling price" value={form.selling_price} onChange={(v) => setForm({ ...form, selling_price: v })} type="number" placeholder="25000" />
            <SelectField label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })}
              options={[{ value: 'USD', label: 'USD' }, { value: 'ZiG', label: 'ZiG' }]} />
            <SelectField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUS_OPTIONS} />
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary-700">Map location (drives the public availability map)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} type="number" placeholder="-17.89" />
              <Field label="Longitude" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} type="number" placeholder="31.05" />
            </div>
          </div>
          <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Corner stand, near entrance…" />
          {error && <p className="text-xs text-primary-700">{error}</p>}
        </div>
      </Modal>
    </Page>
  )
}
