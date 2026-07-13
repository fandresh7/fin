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
