import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, ListChecks } from 'lucide-react'
import { developmentApi } from '../../services/api'
import {
  Page, BackLink, Section, DL, StatusBadge, Th, Td, Button, asList, money, Skeleton,
} from './_kit'

export default function AgreementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const aid = Number(id)
  const qc = useQueryClient()

  const { data: a, isLoading } = useQuery({
    queryKey: ['agreement', aid],
    queryFn: () => developmentApi.agreements.get(aid).then((r) => r.data),
  })
  const { data: instData } = useQuery({
    queryKey: ['agreement-installments', aid],
    queryFn: () => developmentApi.installments.list({ agreement: aid, page_size: 100 }).then((r) => r.data),
  })
  const { data: payData } = useQuery({
    queryKey: ['agreement-payments', aid],
    queryFn: () => developmentApi.payments.list({ agreement: aid, page_size: 100 }).then((r) => r.data),
  })
  const installments = asList(instData)
  const payments = asList(payData)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['agreement', aid] })
    qc.invalidateQueries({ queryKey: ['agreement-installments', aid] })
    qc.invalidateQueries({ queryKey: ['development-dashboard'] })
  }
  const activate = useMutation({ mutationFn: () => developmentApi.agreements.activate(aid), onSuccess: invalidate })
  const genSchedule = useMutation({ mutationFn: () => developmentApi.agreements.generateSchedule(aid), onSuccess: invalidate })

  const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

  return (
    <Page>
      <BackLink to="/dashboard/agreements" label="All agreements" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {isLoading ? <Skeleton className="h-8 w-48" /> : a?.agreement_number}
          </h1>
          <p className="text-sm text-ink-muted">{a?.buyer_name || a?.ownership?.label} · Stand {a?.stand_number} · {a?.project_name}</p>
        </div>
        <div className="flex items-center gap-2">
          {a?.status === 'draft' && (
            <Button onClick={() => activate.mutate()} disabled={activate.isPending}>
              <CheckCircle2 className="h-4 w-4" /> Activate
            </Button>
          )}
          <Button variant="outline" onClick={() => genSchedule.mutate()} disabled={genSchedule.isPending}>
            <ListChecks className="h-4 w-4" /> Generate schedule
          </Button>
          {a && <StatusBadge status={a.status} />}
        </div>
      </div>

      <Section title="Terms">
        {!a ? <Skeleton className="h-24 w-full" /> : (
          <DL items={[
            ['Sale price', money(a.sale_price, a.currency)],
            ['Deposit', money(a.deposit_amount, a.currency)],
            ['Financed balance', money(a.balance, a.currency)],
            ['Total paid', money(totalPaid, a.currency)],
            ['Term', `${a.installment_term_months} months`],
            ['Frequency', a.payment_frequency],
            ['Agreement date', a.agreement_date],
            ['Agency', a.agency_name],
            ['Agent', a.agent_name],
          ]} />
        )}
      </Section>

      {a?.ownership && (
        <Section title="Ownership">
          <div className="space-y-1.5">
            {a.ownership.shares?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{s.buyer_name}{s.is_primary ? ' · primary' : ''}</span>
                <span className="font-medium tabular-nums text-ink">{s.percentage}%</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={`Installments (${installments.length})`}>
        {installments.length === 0 ? (
          <p className="text-sm text-ink-muted">No schedule yet — click “Generate schedule”.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-cream-dark bg-cream-light">
                <tr><Th>#</Th><Th>Due</Th><Th className="text-right">Amount</Th><Th className="text-right">Paid</Th><Th className="text-right">Outstanding</Th><Th>Status</Th></tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {installments.map((i: any) => (
                  <tr key={i.id}>
                    <Td>{i.number}</Td><Td>{i.due_date}</Td>
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
      </Section>

      <Section title={`Payments (${payments.length})`}>
        {payments.length === 0 ? (
          <p className="text-sm text-ink-muted">No payments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-cream-dark bg-cream-light">
                <tr><Th>Receipt</Th><Th>Date</Th><Th>Method</Th><Th>GL journal</Th><Th className="text-right">Amount</Th></tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {payments.map((p: any) => (
                  <tr key={p.id} className="cursor-pointer hover:bg-cream-light" onClick={() => navigate(`/dashboard/payments/${p.id}`)}>
                    <Td className="font-medium text-ink">{p.payment_number}</Td>
                    <Td>{p.date}</Td>
                    <Td className="capitalize">{p.method?.replace(/_/g, ' ')}</Td>
                    <Td>{p.journal_number
                      ? <code className="rounded bg-forest/10 px-1.5 py-0.5 text-xs text-forest">{p.journal_number}</code> : '—'}</Td>
                    <Td className="text-right font-medium tabular-nums text-forest">{money(p.amount, p.currency)}</Td>
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
