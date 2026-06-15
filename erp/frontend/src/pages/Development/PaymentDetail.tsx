import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { developmentApi, journalApi } from '../../services/api'
import {
  Page, BackLink, Section, DL, Th, Td, asList, money, Skeleton,
} from './_kit'

export default function PaymentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pid = Number(id)

  const { data: p, isLoading } = useQuery({
    queryKey: ['payment', pid],
    queryFn: () => developmentApi.payments.get(pid).then((r) => r.data),
  })

  // The GL journal this payment posted (Dr Bank / Cr Buyer Receivable).
  const { data: journal } = useQuery({
    queryKey: ['journal', p?.journal],
    queryFn: () => journalApi.get(p.journal).then((r) => r.data),
    enabled: !!p?.journal,
  })
  const entries = asList(journal?.entries)

  return (
    <Page>
      <BackLink to="/dashboard/payments" label="All payments" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {isLoading ? <Skeleton className="h-8 w-44" /> : p?.payment_number}
          </h1>
          <p className="text-sm text-ink-muted">{p?.agreement_number}</p>
        </div>
        {p && <span className="text-2xl font-bold tabular-nums text-forest">{money(p.amount, p.currency)}</span>}
      </div>

      <Section title="Payment details">
        {!p ? <Skeleton className="h-24 w-full" /> : (
          <DL items={[
            ['Receipt no.', p.payment_number],
            ['Amount', money(p.amount, p.currency)],
            ['Date', p.date],
            ['Method', <span className="capitalize">{p.method?.replace(/_/g, ' ')}</span>],
            ['Type', p.is_deposit ? 'Deposit' : 'Installment'],
            ['Reference', p.reference],
            ['Agreement', p.agreement_number ? (
              <button className="text-primary-700 hover:underline" onClick={() => navigate(`/dashboard/agreements/${p.agreement}`)}>
                {p.agreement_number}
              </button>
            ) : null],
            ['GL journal', p.journal_number],
          ]} />
        )}
      </Section>

      <Section title="General ledger posting">
        {!p?.journal ? (
          <p className="text-sm text-ink-muted">Not yet posted to the ledger.</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-ink-muted">Journal {p.journal_number} — loading entries…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-cream-dark bg-cream-light">
                <tr><Th>Account</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th></tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {entries.map((e: any) => (
                  <tr key={e.id}>
                    <Td className="text-ink">
                      {e.account_code || e.account?.code} {e.account_name || e.account?.name || e.description}
                    </Td>
                    <Td className="text-right tabular-nums">{Number(e.debit_amount) ? money(e.debit_amount) : '—'}</Td>
                    <Td className="text-right tabular-nums">{Number(e.credit_amount) ? money(e.credit_amount) : '—'}</Td>
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
