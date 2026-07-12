export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Transaction {
  id: string
  accountId: string
  categoryId: string | null
  type: TransactionType
  amount: number
  currency: string
  description: string | null
  occurredAt: string
  transferAccountId: string | null
  createdAt: string
}

export interface TransactionInput {
  accountId: string
  categoryId: string | null
  type: TransactionType
  amount: number
  currency: string
  description: string
  occurredAt: string
  transferAccountId: string | null
}

export interface TransactionRow {
  id: string
  account_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  currency: string
  description: string | null
  occurred_at: string
  transfer_account_id: string | null
  created_at: string
}
