import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Phone, Trash2, Globe } from 'lucide-react'
import { developmentApi } from '../../services/api'
import {
  Page, PageHeader, Card, StatusBadge, SearchInput, asList, Skeleton,
} from './_kit'
import { formatDistanceToNow } from '../../lib/utils'

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
]

export default function Inquiries() {
  const qc = useQueryClient()
  const [stage, setStage] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['dev-inquiries', stage],
    queryFn: () => developmentApi.inquiries.list({
      page_size: 200, ordering: '-created_at', ...(stage ? { status: stage } : {}),
    }).then((r) => r.data),
  })
  const inquiries = asList(data).filter((i: any) =>
    !search || i.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase()) ||
    i.phone?.includes(search)
  )

  // --- Optimistic helpers: patch every cached inquiry list in place ---------
  const patchLists = (fn: (arr: any[]) => any[]) =>
    qc.setQueriesData({ queryKey: ['dev-inquiries'] }, (old: any) => {
      if (!old) return old
      if (Array.isArray(old)) return fn(old)
      if (Array.isArray(old.results)) return { ...old, results: fn(old.results) }
      return old
    })

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      developmentApi.inquiries.update(id, { status }),
    // Optimistic: flip the badge instantly, roll back if the request fails.
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['dev-inquiries'] })
      const prev = qc.getQueriesData({ queryKey: ['dev-inquiries'] })
      patchLists((arr) => arr.map((i) => (i.id === id ? { ...i, status } : i)))
      return { prev }
    },
    onError: (_e, _v, ctx: any) => ctx?.prev?.forEach(([k, v]: any) => qc.setQueryData(k, v)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['dev-inquiries'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => developmentApi.inquiries.delete(id),
    // Optimistic: remove the card immediately.
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ['dev-inquiries'] })
      const prev = qc.getQueriesData({ queryKey: ['dev-inquiries'] })
      patchLists((arr) => arr.filter((i) => i.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx: any) => ctx?.prev?.forEach(([k, v]: any) => qc.setQueryData(k, v)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['dev-inquiries'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
    },
  })

  return (
    <Page>
      <PageHeader
        eyebrow="Sales · CRM"
        title="Website inquiries"
        subtitle="Every enquiry submitted on the public Cardinal website lands here in real time. Qualify and convert leads into buyers."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Search name / email / phone…" />}
      />

      <div className="flex flex-wrap gap-1.5">
        {['', ...STAGES.map((s) => s.value)].map((s) => (
          <button key={s || 'all'} onClick={() => setStage(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
              stage === s ? 'bg-primary-700 text-cream' : 'bg-white text-ink-muted border border-cream-dark hover:border-primary-300'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      )}
      {!isLoading && inquiries.length === 0 && (
        <Card className="py-16 text-center">
          <Globe className="mx-auto h-8 w-8 text-cream-dark" />
          <p className="mt-3 text-lg font-bold text-ink">No inquiries yet</p>
          <p className="text-sm text-ink-muted">New leads from the website will appear here automatically.</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {inquiries.map((i: any) => (
          <Card key={i.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">{i.full_name}</h3>
                <p className="text-xs uppercase tracking-wider text-ink-muted">
                  {i.kind} · {i.development_name || 'General enquiry'}
                  {i.stand_number ? ` · Stand ${i.stand_number}` : ''}
                </p>
              </div>
              <StatusBadge status={i.status} />
            </div>

            {i.message && <p className="mt-3 text-sm italic text-ink-soft">“{i.message}”</p>}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
              {i.email && (
                <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1.5 hover:text-primary-700">
                  <Mail className="h-3.5 w-3.5" /> {i.email}
                </a>
              )}
              {i.phone && (
                <a href={`tel:${i.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary-700">
                  <Phone className="h-3.5 w-3.5" /> {i.phone}
                </a>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-cream-dark pt-3">
              <span className="text-xs text-ink-muted">
                {i.source} · {formatDistanceToNow(i.created_at)}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={i.status}
                  onChange={(e) => update.mutate({ id: i.id, status: e.target.value })}
                  className="rounded-full border border-cream-dark bg-cream-light px-3 py-1.5 text-xs font-medium capitalize text-ink outline-none focus:border-primary-700"
                >
                  {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button onClick={() => remove.mutate(i.id)} className="text-ink-muted hover:text-primary-700" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  )
}
