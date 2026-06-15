import type { StandStatus } from '../data/stands'

// Light/editorial palette aligned to the Cardinal + Silverbrook brand.
export const STATUS_META: Record<
  StandStatus,
  { label: string; fill: string; stroke: string; dot: string; text: string }
> = {
  available: {
    label: 'Available',
    fill: 'rgba(1,102,48,0.14)',
    stroke: '#016630',
    dot: '#016630',
    text: '#015026',
  },
  reserved: {
    label: 'Reserved',
    fill: 'rgba(180,168,135,0.30)',
    stroke: '#9a8f6e',
    dot: '#9a8f6e',
    text: '#6f6549',
  },
  sold: {
    label: 'Sold',
    fill: 'rgba(26,26,26,0.06)',
    stroke: '#c9c4bc',
    dot: '#a8a29a',
    text: '#9a948b',
  },
}

export const SELECTED_STROKE = '#75191b'
