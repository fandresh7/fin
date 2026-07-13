import { Service, inject, signal } from '@angular/core'
import { AuthService } from '../auth/auth.service'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { Transaction, TransactionInput, TransactionRow } from './transaction.model'

function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    occurredAt: row.occurred_at,
    transferAccountId: row.transfer_account_id,
    cardStatementId: row.card_statement_id,
    createdAt: row.created_at
  }
}

function toRow(input: TransactionInput, userId: string) {
  const isTransfer = input.type === 'transfer'

  return {
    user_id: userId,
    account_id: input.accountId,
    category_id: isTransfer ? null : input.categoryId,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    description: input.description || null,
    occurred_at: input.occurredAt,
    transfer_account_id: isTransfer ? input.transferAccountId : null,
    card_statement_id: input.type === 'expense' ? input.cardStatementId : null
  }
}

export interface TransactionFilters {
  accountId?: string
  categoryId?: string
  startDate?: string
  endDate?: string
}

const RECENT_LIMIT = 200

@Service()
export class TransactionsService {
  private readonly supabase = inject(SupabaseClientService).client
  private readonly auth = inject(AuthService)

  private readonly _transactions = signal<Transaction[]>([])
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)
  private _lastFilters: TransactionFilters = {}

  readonly transactions = this._transactions.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(filters: TransactionFilters = {}): Promise<void> {
    this._isLoading.set(true)
    this._error.set(null)
    this._lastFilters = filters

    let query = this.supabase.from('transactions').select('*')

    if (filters.accountId) query = query.eq('account_id', filters.accountId)
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters.startDate) query = query.gte('occurred_at', filters.startDate)
    if (filters.endDate) query = query.lte('occurred_at', filters.endDate)

    const { data, error } = await query.order('occurred_at', { ascending: false }).order('created_at', { ascending: false }).limit(RECENT_LIMIT)

    if (error) {
      this._error.set('No se pudieron cargar los movimientos.')
      this._isLoading.set(false)
      return
    }

    this._transactions.set((data as TransactionRow[]).map(fromRow))
    this._isLoading.set(false)
  }

  async create(input: TransactionInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { error } = await this.supabase.from('transactions').insert(toRow(input, userId))
    if (error) throw error

    await this.load(this._lastFilters)
  }

  async update(id: string, input: TransactionInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { error } = await this.supabase.from('transactions').update(toRow(input, userId)).eq('id', id)
    if (error) throw error

    await this.load(this._lastFilters)
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('transactions').delete().eq('id', id)
    if (error) throw error

    this._transactions.update(list => list.filter(t => t.id !== id))
  }
}
