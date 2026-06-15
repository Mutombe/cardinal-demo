import { useState } from 'react'
import type { SitePlanData } from '../lib/plots'

const STYLE = {
  available: { fill: 'rgba(1,102,48,0.16)', hover: 'rgba(1,102,48,0.34)', stroke: '#016630', text: '#015026' },
  reserved: { fill: 'rgba(180,168,135,0.32)', hover: 'rgba(180,168,135,0.32)', stroke: '#9a8f6e', text: '#6f6549' },
  sold: { fill: 'rgba(26,26,26,0.05)', hover: 'rgba(26,26,26,0.05)', stroke: '#cdc8bf', text: '#b3ada3' },
} as const

const SELECTED = '#75191b'

interface Props {
  data: SitePlanData
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function SitePlan({ data, selectedId, onSelect }: Props) {
  const [hover, setHover] = useState<string | null>(null)
  const { plots, width, height } = data

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-dark bg-[#fbfaf7] p-3 sm:p-5">
      <svg
        viewBox={`-4 -4 ${width + 8} ${height + 8}`}
        className="h-auto w-full"
        style={{ maxHeight: 560 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {plots.map((p) => {
          const s = STYLE[p.status]
          const selected = p.id === selectedId
          const interactive = p.status === 'available'
          const isHover = hover === p.id && interactive
          return (
            <g
              key={p.id}
              className={interactive ? 'cursor-pointer' : 'cursor-default'}
              onClick={() => interactive && onSelect(p.id)}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
            >
              <rect
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                rx={2}
                fill={selected ? 'rgba(117,25,27,0.14)' : isHover ? s.hover : s.fill}
                stroke={selected ? SELECTED : s.stroke}
                strokeWidth={selected ? 2.4 : 0.9}
                style={{ transition: 'fill .15s' }}
              />
              <text
                x={p.x + p.w / 2}
                y={p.y + p.h / 2 + 3}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight={selected ? 700 : 500}
                fill={selected ? SELECTED : s.text}
              >
                {p.n}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
