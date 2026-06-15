import { useState } from 'react'
import type { Stand, StandStatus } from '../data/stands'
import { ROADS, PLAN_VIEWBOX } from '../data/stands'
import { STATUS_META, SELECTED_STROKE } from '../lib/status'
import { formatUSD, formatNumber } from '../lib/finance'

interface Props {
  stands: Stand[]
  selectedId: string | null
  filter: StandStatus | 'all'
  onSelect: (id: string) => void
}

export default function MasterPlanMap({ stands, selectedId, filter, onSelect }: Props) {
  const [hover, setHover] = useState<{ stand: Stand; x: number; y: number } | null>(null)

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-cream-dark bg-[#f3efe8]">
      <div className="pointer-events-none absolute left-5 top-5 z-10">
        <div className="text-[11px] font-semibold uppercase tracking-widest2 text-maroon">
          Silverbrook Estate
        </div>
        <div className="text-xs text-ink-muted">Phase 1 · Site Plan</div>
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-10 text-right text-[11px] uppercase tracking-widest text-ink-muted/70">
        N ↑
      </div>

      <svg
        viewBox={`0 0 ${PLAN_VIEWBOX.w} ${PLAN_VIEWBOX.h}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <pattern id="paper" width="38" height="38" patternUnits="userSpaceOnUse">
            <path d="M38 0H0V38" fill="none" stroke="rgba(122,108,80,0.10)" strokeWidth="1" />
          </pattern>
          <linearGradient id="reserve" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(1,102,48,0.12)" />
            <stop offset="100%" stopColor="rgba(1,102,48,0.03)" />
          </linearGradient>
        </defs>

        <rect x={0} y={0} width={PLAN_VIEWBOX.w} height={PLAN_VIEWBOX.h} fill="url(#paper)" />
        <rect x={0} y={620} width={PLAN_VIEWBOX.w} height={100} fill="url(#reserve)" />
        <text x={500} y={690} textAnchor="middle" fill="rgba(1,102,48,0.5)" fontSize="12" letterSpacing="4">
          PARK &amp; WETLAND RESERVE
        </text>

        {/* Roads */}
        {ROADS.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#e7e1d6" rx={2} />
            <line
              x1={r.x + 4}
              y1={r.y + r.h / 2}
              x2={r.x + r.w - 4}
              y2={r.y + r.h / 2}
              stroke="#c3b89f"
              strokeWidth="1.5"
              strokeDasharray="9 12"
            />
          </g>
        ))}

        {stands.map((s) => {
          const meta = STATUS_META[s.status]
          const dimmed = filter !== 'all' && s.status !== filter
          const selected = s.id === selectedId
          const interactive = s.status !== 'sold'

          return (
            <g
              key={s.id}
              className={interactive ? 'cursor-pointer' : 'cursor-default'}
              style={{ opacity: dimmed ? 0.2 : 1, transition: 'opacity 0.3s' }}
              onClick={() => interactive && onSelect(s.id)}
              onMouseMove={(e) => {
                const box = (
                  e.currentTarget.ownerSVGElement!.parentElement as HTMLElement
                ).getBoundingClientRect()
                setHover({ stand: s, x: e.clientX - box.left, y: e.clientY - box.top })
              }}
            >
              <rect
                x={s.svg.x}
                y={s.svg.y}
                width={s.svg.w}
                height={s.svg.h}
                rx={3}
                fill={meta.fill}
                stroke={selected ? SELECTED_STROKE : meta.stroke}
                strokeWidth={selected ? 3.5 : 1.25}
                style={{ transition: 'stroke 0.15s, stroke-width 0.15s, fill 0.15s' }}
              />
              {s.premium && !dimmed && (
                <circle cx={s.svg.x + s.svg.w - 9} cy={s.svg.y + 9} r={2.6} fill="#b4a887" />
              )}
              <text
                x={s.svg.x + s.svg.w / 2}
                y={s.svg.y + s.svg.h / 2 - 1}
                textAnchor="middle"
                fontSize="13"
                fontWeight={600}
                fill={meta.text}
              >
                {s.id}
              </text>
              <text
                x={s.svg.x + s.svg.w / 2}
                y={s.svg.y + s.svg.h / 2 + 13}
                textAnchor="middle"
                fontSize="9.5"
                fill="rgba(26,26,26,0.45)"
              >
                {formatNumber(s.area)} m²
              </text>
            </g>
          )
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-20 w-44 rounded-xl border border-cream-dark bg-white px-3.5 py-2.5 text-xs shadow-xl"
          style={{
            left: hover.x + 14,
            top: hover.y + 14,
            transform: hover.x > 300 ? 'translateX(-112%)' : undefined,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="display text-base font-semibold text-ink">Stand {hover.stand.id}</span>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[hover.stand.status].dot }} />
          </div>
          <div className="mt-0.5 text-ink-muted">
            {hover.stand.frontage} × {hover.stand.depth} m · {formatNumber(hover.stand.area)} m²
          </div>
          <div className="mt-1 font-semibold text-maroon">
            {hover.stand.status === 'sold' ? 'Sold' : formatUSD(hover.stand.price)}
          </div>
        </div>
      )}
    </div>
  )
}
