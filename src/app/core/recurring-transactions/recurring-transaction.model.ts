export type RecurrenceIntervalUnit = 'day' | 'week' | 'month'
export type RecurringTransactionType = 'income' | 'expense'

export interface RecurringTransaction {
  id: string
  accountId: string
  categoryId: string | null
  type: RecurringTransactionType
  amount: number
  currency: string
  description: string | null
  intervalUnit: RecurrenceIntervalUnit
  intervalCount: number
  startDate: string
  nextRunDate: string
  endDate: string | null
  isActive: boolean
}

export interface RecurringTransactionInput {
  accountId: string
  categoryId: string
  type: RecurringTransactionType
  amount: number
  currency: string
  description: string
  intervalUnit: RecurrenceIntervalUnit
  intervalCount: number
  startDate: string
  endDate: string
}

const UNIT_LABELS: Record<RecurrenceIntervalUnit, { singular: string; plural: string }> = {
  day: { singular: 'día', plural: 'días' },
  week: { singular: 'semana', plural: 'semanas' },
  month: { singular: 'mes', plural: 'meses' }
}

export function formatFrequency(unit: RecurrenceIntervalUnit, count: number): string {
  if (count === 1) return `Cada ${UNIT_LABELS[unit].singular}`
  return `Cada ${count} ${UNIT_LABELS[unit].plural}`
}

export interface CatchUpResult {
  pendingDates: string[]
  nextRunDate: string
  isActive: boolean
}

function advanceDate(dateIso: string, unit: RecurrenceIntervalUnit, count: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`)
  if (unit === 'day') date.setUTCDate(date.getUTCDate() + count)
  else if (unit === 'week') date.setUTCDate(date.getUTCDate() + count * 7)
  else date.setUTCMonth(date.getUTCMonth() + count)
  return date.toISOString().slice(0, 10)
}

// Mirrors generate_recurring_transactions() in the DB: walks from startDate through today (bounded
// by endDate) collecting every occurrence that's already due, so the UI can offer to backfill them
// instead of silently skipping to a single catch-up run on the next cron pass.
export function computeCatchUp(startDate: string, intervalUnit: RecurrenceIntervalUnit, intervalCount: number, endDate: string | null, todayIso: string): CatchUpResult {
  const pendingDates: string[] = []
  let current = startDate

  while (current <= todayIso && (!endDate || current <= endDate)) {
    pendingDates.push(current)
    current = advanceDate(current, intervalUnit, intervalCount)
  }

  return { pendingDates, nextRunDate: current, isActive: !endDate || current <= endDate }
}

export interface RecurringTransactionRow {
  id: string
  account_id: string
  category_id: string | null
  type: RecurringTransactionType
  amount: number
  currency: string
  description: string | null
  interval_unit: RecurrenceIntervalUnit
  interval_count: number
  start_date: string
  next_run_date: string
  end_date: string | null
  is_active: boolean
}
