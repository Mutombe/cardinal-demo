import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { Mail, Phone, UserPlus, Globe } from 'lucide-react'
import { developmentApi } from '../../services/api'
import {
  Page, BackLink, Section, DL, StatusBadge, SelectField, Button, Skeleton, money,
} from './_kit'
import { formatDistanceToNow } from '../../lib/utils'

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
]

export default function InquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const iid = Number(id)
  const qc = useQueryClient()
  const [msg, setMsg] = useState('')

  const { data: i, isLoading } = useQuery({
    queryKey: ['inquiry', iid],
    queryFn: () => developmentApi.inquiries.get(iid).then((r) => r.data),
  })

  const setStatus = useMutation({
    mutationFn: (status: string) => developmentApi.inquiries.update(iid, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiry', iid] })
      qc.invalidateQueries({ queryKey: ['dev-inquiries'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
    },
  })

  // Convert the lead into a buyer record, then mark it converted.
  const convert = useMutation({
    mutationFn: async () => {
      const buyer = await developmentApi.buyers.create({
        full_name: i.full_name, email: i.email, phone: i.phone,
      })
      await developmentApi.inquiries.update(iid, { status: 'converted' })
      return buyer.data
    },
    onSuccess: (buyer: any) => {
      qc.invalidateQueries({ queryKey: ['inquiry', iid] })
      qc.invalidateQueries({ queryKey: ['dev-buyers'] })
      qc.invalidateQueries({ queryKey: ['development-dashboard'] })
      setMsg(`Created buyer ${buyer.code}. Opening their profile…`)
      navigate(`/dashboard/buyers/${buyer.id}`)
    },
    onError: () => setMsg('Could not convert — that buyer may already exist.'),
  })

  return (
    <Page>
      <BackLink to="/dashboard/inquiries" label="All inquiries" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {isLoading ? <Skeleton className="h-8 w-48" /> : i?.full_name}
          </h1>
          <p className="text-sm capitalize text-ink-muted">
            {i?.kind} enquiry · {i?.development_name || 'General'}{i?.stand_number ? ` · Stand ${i.stand_number}` : ''}
          </p>
        </div>
        {i && <StatusBadge status={i.status} />}
      </div>

      {i?.message && (
        <Section title="Message">
          <p className="text-sm italic leading-relaxed text-ink-soft">“{i.message}”</p>
        </Section>
      )}

      <Section title="Lead details">
        {!i ? <Skeleton className="h-24 w-full" /> : (
          <DL items={[
            ['Name', i.full_name],
            ['Email', i.email ? <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1 text-primary-700 hover:underline"><Mail className="h-3.5 w-3.5" />{i.email}</a> : null],
            ['Phone', i.phone ? <a href={`tel:${i.phone}`} className="inline-flex items-center gap-1 text-primary-700 hover:underline"><Phone className="h-3.5 w-3.5" />{i.phone}</a> : null],
            ['Development', i.development_name],
            ['Stand', i.stand_number],
            ['Kind', i.kind],
            ['Source', <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{i.source}</span>],
            ['Received', i.created_at ? `${new Date(i.created_at).toLocaleString()} (${formatDistanceToNow(i.created_at)})` : null],
          ]} />
        )}
      </Section>

      <Section title="Manage" action={
        i?.status !== 'converted' && i && (
          <Button onClick={() => convert.mutate()} disabled={convert.isPending || !i.full_name}>
            <UserPlus className="h-4 w-4" /> {convert.isPending ? 'Converting…' : 'Convert to buyer'}
          </Button>
        )
      }>
        <div className="max-w-xs">
          <SelectField label="Pipeline stage" value={i?.status || 'new'} onChange={(v) => setStatus.mutate(v)} options={STAGES} />
        </div>
        {msg && <p className="mt-3 text-sm text-forest">{msg}</p>}
      </Section>
    </Page>
  )
}
