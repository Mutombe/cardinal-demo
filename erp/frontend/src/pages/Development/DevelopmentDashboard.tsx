import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  Map, LandPlot, Banknote, TrendingUp, Inbox, ArrowUpRight, ExternalLink,
} from 'lucide-react'
import { developmentApi } from '../../services/api'
import { formatDistanceToNow } from '../../lib/utils'
import { Card, Stat, StatusBadge, Meter, Th, Td, money, Skeleton } from './_kit'

const MAROON = '#75191b'
const FOREST = '#016630'
const SAND = '#b4a887'
const GREY = '#e5e2dc'

export default function DevelopmentDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['development-dashboard'],
    queryFn: () => developmentApi.dashboard().then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })

  const stands = data?.stands || { total: 0, available: 0, reserved: 0, sold: 0, sell_through: 0 }
  const finance = data?.finance || {}
  const sales = data?.sales || {}
  const pipeline = data?.pipeline || {}
  const projects: any[] = data?.projects?.list || []
  const inquiries: any[] = data?.recent_inquiries || []
  const payments: any[] = data?.recent_payments || []
  const series: any[] = data?.collection_series || []

  const donut = [
    { name: 'Available', value: stands.available, color: FOREST },
    { name: 'Reserved', value: stands.reserved, color: SAND },
    { name: 'Sold', value: stands.sold, color: MAROON },
  ].filter((d) => d.value > 0)

  const pipelineStages = [
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'converted', label: 'Converted' },
  ]
  const pipeMax = Math.max(1, ...pipelineStages.map((s) => pipeline[s.key] || 0))

  return (
    <div className="min-h-screen bg-cream-light -m-4 p-4 md:-m-6 md:p-8">
      <div className="mx-auto max-w-content space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest2 text-primary-700">
              Cardinal Properties · Developer ERP
            </span>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
              Portfolio overview
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Live inventory, sales pipeline and trust-account collections across all developments.
            </p>
          </div>
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary-700 px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50"
          >
            <ExternalLink className="h-4 w-4" /> View public website
          </a>
        </div>

        {/* Hero finance band */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Stat
            tone="maroon"
            label="Contract value"
            value={isLoading ? <Skeleton className="h-9 w-32 bg-cream/30" /> : money(finance.contract_value)}
            sub={`${sales.agreements || 0} agreements · ${sales.active || 0} active`}
          />
          <Stat
            label="Collected"
            value={isLoading ? <Skeleton className="h-9 w-32" /> : money(finance.collected)}
            sub={`${finance.collection_rate || 0}% of contract value`}
          />
          <Stat
            label="Outstanding"
            value={isLoading ? <Skeleton className="h-9 w-32" /> : money(finance.outstanding)}
            sub={`${money(finance.deposits)} in deposits`}
          />
          <Stat
            label="Stand sell-through"
            value={isLoading ? <Skeleton className="h-9 w-20" /> : `${stands.sell_through}%`}
            sub={`${stands.sold} sold · ${stands.reserved} reserved · ${stands.available} available`}
          />
        </motion.div>

        {/* Quick counts */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <QuickCount icon={Map} label="Developments" value={data?.projects?.total ?? 0}
            hint={`${data?.projects?.now_selling ?? 0} now selling`} onClick={() => navigate('/dashboard/developments')} />
          <QuickCount icon={LandPlot} label="Stands" value={stands.total}
            hint={`${stands.available} available`} onClick={() => navigate('/dashboard/stands')} />
          <QuickCount icon={Inbox} label="Open inquiries" value={(pipeline.new || 0) + (pipeline.contacted || 0) + (pipeline.qualified || 0)}
            hint={`${pipeline.total || 0} all-time`} onClick={() => navigate('/dashboard/inquiries')} />
          <QuickCount icon={Banknote} label="Buyers" value={finance.buyers ?? 0}
            hint={`${finance.agencies ?? 0} agencies`} onClick={() => navigate('/dashboard/buyers')} />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Collections trend */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">Collections</h2>
                <p className="text-xs text-ink-muted">Cash received into trust · last 6 months</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary-700" />
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="cardCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={MAROON} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={MAROON} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GREY} vertical={false} />
                  <XAxis dataKey="month" stroke="#9a8f6e" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9a8f6e" fontSize={12} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: any) => [money(v), 'Collected']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e2dc', fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="collected" stroke={MAROON} strokeWidth={2.5}
                    fill="url(#cardCollected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Inventory donut */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-ink">Inventory</h2>
            <p className="text-xs text-ink-muted">{stands.total} stands across the portfolio</p>
            <div className="relative mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut.length ? donut : [{ name: 'None', value: 1, color: GREY }]}
                    dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={2} stroke="none">
                    {(donut.length ? donut : [{ color: GREY }]).map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e2dc', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-ink">{stands.sell_through}%</span>
                <span className="text-[10px] uppercase tracking-widest text-ink-muted">committed</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <LegendRow color={FOREST} label="Available" value={stands.available} />
              <LegendRow color={SAND} label="Reserved" value={stands.reserved} />
              <LegendRow color={MAROON} label="Sold" value={stands.sold} />
            </div>
          </Card>
        </div>

        {/* Projects + pipeline */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Project portfolio */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-bold text-ink">Developments</h2>
              <button onClick={() => navigate('/dashboard/developments')}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline">
                Manage all <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-cream-dark bg-cream-light">
                  <tr>
                    <Th>Development</Th>
                    <Th className="text-right">Stands</Th>
                    <Th className="w-40">Sell-through</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-dark">
                  {projects.length === 0 && (
                    <tr><Td className="py-8 text-center text-ink-muted">No developments yet.</Td></tr>
                  )}
                  {projects.map((p) => (
                    <tr key={p.id} className="cursor-pointer transition hover:bg-cream-light"
                      onClick={() => navigate('/dashboard/stands?project=' + p.id)}>
                      <Td>
                        <div className="font-medium text-ink">{p.name}</div>
                        <div className="text-xs text-ink-muted">{p.location || '—'}</div>
                      </Td>
                      <Td className="text-right tabular-nums">
                        <span className="font-medium text-ink">{p.stands_total}</span>
                        <div className="text-xs text-ink-muted">{p.available} available</div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Meter value={p.sell_through} className="flex-1" />
                          <span className="w-10 text-right text-xs tabular-nums text-ink-soft">{p.sell_through}%</span>
                        </div>
                      </Td>
                      <Td><StatusBadge status={p.status} label={p.status_display} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Sales pipeline */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-ink">Sales pipeline</h2>
            <p className="text-xs text-ink-muted">{pipeline.total || 0} total inquiries</p>
            <div className="mt-5 space-y-4">
              {pipelineStages.map((s) => {
                const n = pipeline[s.key] || 0
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-soft">{s.label}</span>
                      <span className="font-medium tabular-nums text-ink">{n}</span>
                    </div>
                    <Meter value={(n / pipeMax) * 100} className="mt-1.5" />
                  </div>
                )
              })}
            </div>
            <button onClick={() => navigate('/dashboard/inquiries')}
              className="mt-6 w-full rounded-full bg-primary-700 py-2.5 text-sm font-medium text-cream transition hover:bg-primary-800">
              Open CRM
            </button>
          </Card>
        </div>

        {/* Feeds */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent website leads */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-bold text-ink">Latest website leads</h2>
              <Inbox className="h-5 w-5 text-primary-700" />
            </div>
            <div className="divide-y divide-cream-dark">
              {inquiries.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-ink-muted">No inquiries yet.</p>
              )}
              {inquiries.map((i) => (
                <div key={i.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="font-medium text-ink">{i.full_name}</div>
                    <div className="text-xs text-ink-muted">
                      {i.development_name || 'General'}
                      {i.stand_number ? ` · Stand ${i.stand_number}` : ''} · {i.source}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={i.status} />
                    <span className="hidden text-xs text-ink-muted sm:inline">
                      {formatDistanceToNow(i.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent payments */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-bold text-ink">Recent payments</h2>
              <Banknote className="h-5 w-5 text-primary-700" />
            </div>
            <div className="divide-y divide-cream-dark">
              {payments.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-ink-muted">No payments recorded yet.</p>
              )}
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="font-medium text-ink">{p.buyer_name}</div>
                    <div className="text-xs text-ink-muted">
                      {p.agreement_number} · {p.method?.replace(/_/g, ' ')}
                      {p.is_deposit ? ' · deposit' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium tabular-nums text-forest">{money(p.amount, p.currency)}</div>
                    <div className="text-xs text-ink-muted">{p.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function QuickCount({ icon: Icon, label, value, hint, onClick }: {
  icon: React.ElementType; label: string; value: number | string; hint?: string; onClick?: () => void
}) {
  return (
    <button onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-cream-dark bg-white p-4 text-left transition hover:border-primary-300 hover:shadow-sm">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-700 transition group-hover:bg-primary-700 group-hover:text-cream">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-ink tabular-nums">{value}</div>
        <div className="text-xs text-ink-muted">{label}{hint ? ` · ${hint}` : ''}</div>
      </div>
    </button>
  )
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-ink-soft">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
      </span>
      <span className="font-medium tabular-nums text-ink">{value}</span>
    </div>
  )
}
