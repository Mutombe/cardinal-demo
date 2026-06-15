// ---------------------------------------------------------------------------
// Instalment maths for the master-plan calculator.
//
// Models a deposit + fixed-term monthly plan. Supports either a flat annual
// interest rate (common for Zimbabwean stand instalment plans) or 0% for a
// straight split. All amounts in USD.
// ---------------------------------------------------------------------------

export interface PlanInput {
  price: number
  depositPct: number // 0..100
  termMonths: number // e.g. 12 | 24 | 36
  annualRate: number // % per annum, flat on the financed balance; 0 = no interest
}

export interface PlanResult {
  deposit: number
  financed: number
  monthly: number
  totalInterest: number
  totalPayable: number
}

export function computePlan({
  price,
  depositPct,
  termMonths,
  annualRate,
}: PlanInput): PlanResult {
  const deposit = Math.round((price * depositPct) / 100)
  const financed = price - deposit

  // Flat interest: rate applied to the whole financed balance per year of term.
  const years = termMonths / 12
  const totalInterest = Math.round((financed * (annualRate / 100) * years))
  const totalPayable = deposit + financed + totalInterest
  const monthly = termMonths > 0 ? Math.round((financed + totalInterest) / termMonths) : 0

  return { deposit, financed, monthly, totalInterest, totalPayable }
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatUSD(n: number): string {
  return usd.format(n)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}
