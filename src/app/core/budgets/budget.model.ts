export interface Budget {
  id: string
  categoryId: string
  name: string | null
  amount: number
  currency: string
  periodStart: string
  periodEnd: string
  spentAmount: number
}

export interface BudgetInput {
  categoryId: string
  name: string
  amount: number
  currency: string
  periodStart: string
  periodEnd: string
}

export interface BudgetProgressRow {
  budget_id: string
  category_id: string
  name: string | null
  amount: number
  currency: string
  period_start: string
  period_end: string
  spent_amount: number
}
