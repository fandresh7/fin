export type AccountType = 'cash' | 'checking' | 'savings' | 'credit_card' | 'crypto_exchange' | 'investment' | 'other'

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: string | null
  institution: string | null
  creditLimit: number | null
  cutoffDay: number | null
  paymentDueDay: number | null
  isArchived: boolean
  createdAt: string
}

export interface AccountInput {
  name: string
  type: AccountType
  currency: string
  institution: string
  creditLimit: number | null
  cutoffDay: number | null
  paymentDueDay: number | null
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Efectivo',
  checking: 'Cuenta corriente',
  savings: 'Cuenta de ahorros',
  credit_card: 'Tarjeta de crédito',
  crypto_exchange: 'Exchange cripto',
  investment: 'Inversión',
  other: 'Otra'
}

export interface AccountRow {
  id: string
  name: string
  type: AccountType
  currency: string | null
  institution: string | null
  credit_limit: number | null
  cutoff_day: number | null
  payment_due_day: number | null
  is_archived: boolean
  created_at: string
}
