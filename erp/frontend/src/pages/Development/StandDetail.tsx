import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { developmentApi } from '../../services/api'
import {
  Page, BackLink, Section, DL, Card, StatusBadge, Th, Td, asList, money, Skeleton,
} from './_kit'

export default function StandDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sid = Number(id)

  const { data: stand, isLoading } = useQuery({
    queryKey: ['stand', sid],
    queryFn: () => developmentApi.stands.get(sid).then((r) => r.data),
  })
  const { data: agrData } = useQuery({
    queryKey: ['stand-agreements', sid],
    queryFn: () => developmentApi.agreements.list({ stand: sid }).then((r) => r.data),
  })
  const agreements = asList(agrData)

  return (
    <Page>
      <BackLink to="/dashboard/stands" label="All stands" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {isLoading ? <Skeleton className="h-8 w-40" /> : `Stand ${stand?.stand_number}`}
          </h1>
          <p className="text-sm text-ink-muted">{stand?.project_name}</p>
        </div>
        {stand && <StatusBadge status={stand.status} />}
      </div>

      <Section title="Stand details">
        {isLoading || !stand ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <DL items={[
            ['Stand number', stand.stand_number],
            ['Code', stand.code],
            ['Development', stand.project_name],
            ['Size', stand.size_sqm ? `${Number(stand.size_sqm).toLocaleString()} m²` : null],
            ['Selling price', money(stand.selling_price, stand.currency)],
            ['Currency', stand.currency],
            ['Status', <StatusBadge status={stand.status} />],
            ['Latitude', stand.latitude],
            ['Longitude', stand.longitude],
            ['Notes', stand.notes],
            ['Added', stand.created_at ? new Date(stand.created_at).toLocaleDateString() : null],
          ]} />
        )}
      </Section>

      <Section title={`Reservations & agreements (${agreements.length})`}>
        {agreements.length === 0 ? (
          <p className="text-sm text-ink-muted">No agreements on this stand yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-cream-dark bg-cream-light">
                <tr><Th>Agreement</Th><Th>Buyer</Th><Th className="text-right">Sale price</Th><Th className="text-right">Balance</Th><Th>Status</Th></tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {agreements.map((a: any) => (
                  <tr key={a.id} className="cursor-pointer transition hover:bg-cream-light"
                    onClick={() => navigate(`/dashboard/agreements/${a.id}`)}>
                    <Td className="font-medium text-ink">{a.agreement_number}</Td>
                    <Td>{a.buyer_name || a.ownership?.label || '—'}</Td>
                    <Td className="text-right tabular-nums">{money(a.sale_price, a.currency)}</Td>
                    <Td className="text-right tabular-nums">{money(a.balance, a.currency)}</Td>
                    <Td><StatusBadge status={a.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </Page>
  )
}
