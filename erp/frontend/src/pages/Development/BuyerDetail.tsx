import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { developmentApi } from '../../services/api'
import {
  Page, BackLink, Section, DL, StatusBadge, Th, Td, asList, money, Skeleton,
} from './_kit'

export default function BuyerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bid = Number(id)

  const { data: b, isLoading } = useQuery({
    queryKey: ['buyer', bid],
    queryFn: () => developmentApi.buyers.get(bid).then((r) => r.data),
  })
  const { data: agrData } = useQuery({
    queryKey: ['buyer-agreements', bid],
    queryFn: () => developmentApi.agreements.list({ buyer: bid }).then((r) => r.data),
  })
  const agreements = asList(agrData)

  return (
    <Page>
      <BackLink to="/dashboard/buyers" label="All buyers" />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {isLoading ? <Skeleton className="h-8 w-48" /> : b?.full_name}
        </h1>
        <p className="text-sm text-ink-muted">{b?.code}</p>
      </div>

      <Section title="Profile">
        {!b ? <Skeleton className="h-24 w-full" /> : (
          <DL items={[
            ['Full name', b.full_name],
            ['National ID', b.national_id],
            ['Passport', b.passport_number],
            ['Date of birth', b.date_of_birth],
            ['Phone', b.phone],
            ['Email', b.email],
            ['Address', b.residential_address],
            ['Next of kin', b.next_of_kin_name],
            ['Kin relationship', b.next_of_kin_relation],
            ['Kin phone', b.next_of_kin_phone],
            ['Notes', b.notes],
          ]} />
        )}
      </Section>

      <Section title={`Agreements (${agreements.length})`}>
        {agreements.length === 0 ? (
          <p className="text-sm text-ink-muted">No agreements for this buyer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-cream-dark bg-cream-light">
                <tr><Th>Agreement</Th><Th>Stand</Th><Th className="text-right">Sale price</Th><Th className="text-right">Balance</Th><Th>Status</Th></tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {agreements.map((a: any) => (
                  <tr key={a.id} className="cursor-pointer hover:bg-cream-light" onClick={() => navigate(`/dashboard/agreements/${a.id}`)}>
                    <Td className="font-medium text-ink">{a.agreement_number}</Td>
                    <Td>{a.stand_number} · {a.project_name}</Td>
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
