export type CardStatementStatus = 'open' | 'closed' | 'paid' | 'overdue'

export interface CardStatement {
  id: string
  accountId: string
  periodStart: string
  periodEnd: string
  dueDate: string
  status: CardStatementStatus
  totalAmount: number
  paidAmount: number
}

export interface CardStatementInput {
  accountId: string
  periodStart: string
  periodEnd: string
  dueDate: string
}

export interface CardStatementUpdateInput {
  status: CardStatementStatus
  paidAmount: number
}

export const CARD_STATEMENT_STATUS_LABELS: Record<CardStatementStatus, string> = {
  open: 'Abierto',
  closed: 'Cerrado',
  paid: 'Pagado',
  overdue: 'Vencido'
}

export interface CardStatementRow {
  id: string
  account_id: string
  period_start: string
  period_end: string
  due_date: string
  status: CardStatementStatus
  total_amount: number
  paid_amount: number
}
