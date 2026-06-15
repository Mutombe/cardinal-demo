import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin } from 'lucide-react'
import { developmentApi } from '../../services/api'
import {
  Page, PageHeader, Card, StatusBadge, Meter, Th, Td, Button, Modal, Field, SelectField,
  SearchInput, asList, TableSkeleton,
} from './_kit'

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'now_selling', label: 'Now selling' },
  { value: 'sold_out', label: 'Sold out' },
  { value: 'completed', label: 'Completed' },
]

export default function Developments() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', slug: '', location: '', city: '', status: 'now_selling',
    total_stands: '', launch_date: '', description: '',
  })
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['dev-projects'],
    queryFn: () => developmentApi.projects.list({ page_size: 200 }).then((r) => r.data),
  })
  const { data: devData } = useQuery({
    queryKey: ['developers'],
    queryFn: () => developmentApi.developers.list().then((r) => r.data),
  })

  const projects = asList(data).filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  )

  const create = useMutation({
    mutationFn: async () => {
      // Ensure a developer exists (single-tenant: Cardinal).
      let developers = asList(devData)
      let developerId = developers[0]?.id
      if (!developerId) {
        const res = await developmentApi.developers.create({ name: 'Cardinal Properties' })
        developerId = res.data.id
      }
      return developmentApi.projects.create({
        name: form.name,
        slug: form.slug,
        location: form.location,
        city: form.city,
        status: form.status,
        total_stands: Number(form.total_stands) || 0,
        launch_date: form.launch_date || null,
        description: form.description,
        developer: developerId,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dev-projects'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
      setOpen(false)
      setForm({ name: '', slug: '', location: '', city: '', status: 'now_selling', total_stands: '', launch_date: '', description: '' })
      setError('')
    },
    onError: (e: any) => setError(e?.response?.data ? JSON.stringify(e.response.data) : 'Failed to create'),
  })

  return (
    <Page>
      <PageHeader
        eyebrow="Content · CMS"
        title="Developments"
        subtitle="Each development here drives the public website — its stands, availability and pricing feed the live map."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search developments…" />
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New</Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-cream-dark bg-cream-light">
              <tr>
                <Th>Development</Th>
                <Th>Slug</Th>
                <Th className="text-right">Stands</Th>
                <Th className="w-44">Sell-through</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {isLoading && <TableSkeleton cols={5} />}
              {!isLoading && projects.length === 0 && (
                <tr><Td className="py-10 text-center text-ink-muted" >No developments yet — create your first one.</Td></tr>
              )}
              {projects.map((p: any) => {
                const total = (p.available_count ?? 0) + (p.reserved_count ?? 0) + (p.sold_count ?? 0)
                const sell = total ? Math.round(100 * ((p.reserved_count ?? 0) + (p.sold_count ?? 0)) / total) : 0
                return (
                  <tr key={p.id} className="cursor-pointer transition hover:bg-cream-light"
                    onClick={() => navigate('/dashboard/stands?project=' + p.id)}>
                    <Td>
                      <div className="font-medium text-ink">{p.name}</div>
                      <div className="flex items-center gap-1 text-xs text-ink-muted">
                        <MapPin className="h-3 w-3" /> {p.location || p.city || '—'}
                      </div>
                    </Td>
                    <Td><code className="rounded bg-cream px-1.5 py-0.5 text-xs text-ink-soft">{p.slug || '—'}</code></Td>
                    <Td className="text-right tabular-nums">
                      <span className="font-medium text-ink">{total}</span>
                      <div className="text-xs text-ink-muted">{p.available_count ?? 0} available</div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Meter value={sell} className="flex-1" />
                        <span className="w-9 text-right text-xs tabular-nums text-ink-soft">{sell}%</span>
                      </div>
                    </Td>
                    <Td><StatusBadge status={p.status} /></Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New development"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
              {create.isPending ? 'Saving…' : 'Create development'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Silverbrook Estate" required />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Website slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="silverbrook" />
            <Field label="Total stands" value={form.total_stands} onChange={(v) => setForm({ ...form, total_stands: v })} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Ruwa" />
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Harare" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUS_OPTIONS} />
            <Field label="Launch date" value={form.launch_date} onChange={(v) => setForm({ ...form, launch_date: v })} type="date" />
          </div>
          <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Short marketing description" />
          {error && <p className="text-xs text-primary-700">{error}</p>}
        </div>
      </Modal>
    </Page>
  )
}
