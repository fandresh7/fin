import { Service, inject, signal } from '@angular/core'
import { AuthService } from '../auth/auth.service'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { Account, AccountBalanceRow, AccountInput, AccountRow } from './account.model'

function fromRow(row: AccountRow, balance = 0): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    institution: row.institution,
    creditLimit: row.credit_limit,
    cutoffDay: row.cutoff_day,
    paymentDueDay: row.payment_due_day,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    balance
  }
}

function toRow(input: AccountInput, userId: string) {
  const isCredit = input.type === 'credit_card'
  const isCrypto = input.type === 'crypto_exchange'

  return {
    user_id: userId,
    name: input.name,
    type: input.type,
    currency: isCrypto ? null : input.currency,
    institution: input.institution || null,
    credit_limit: isCredit ? input.creditLimit : null,
    cutoff_day: isCredit ? input.cutoffDay : null,
    payment_due_day: isCredit ? input.paymentDueDay : null
  }
}

@Service()
export class AccountsService {
  private readonly supabase = inject(SupabaseClientService).client
  private readonly auth = inject(AuthService)

  private readonly _accounts = signal<Account[]>([])
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly accounts = this._accounts.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(): Promise<void> {
    this._isLoading.set(true)
    this._error.set(null)

    const { data, error } = await this.supabase.from('accounts').select('*').eq('is_archived', false).order('created_at', { ascending: true })

    if (error) {
      this._error.set('No se pudieron cargar las cuentas.')
      this._isLoading.set(false)
      return
    }

    const rows = data as AccountRow[]
    const { data: balanceRows } = await this.supabase
      .from('account_balances')
      .select('account_id, balance')
      .in(
        'account_id',
        rows.map(row => row.id)
      )

    const balanceByAccountId = new Map((balanceRows as AccountBalanceRow[] | null)?.map(row => [row.account_id, row.balance]))

    this._accounts.set(rows.map(row => fromRow(row, balanceByAccountId.get(row.id) ?? 0)))
    this._isLoading.set(false)
  }

  async create(input: AccountInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { data, error } = await this.supabase.from('accounts').insert(toRow(input, userId)).select().single()
    if (error) throw error

    this._accounts.update(list => [...list, fromRow(data as AccountRow)])
  }

  async update(id: string, input: AccountInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { data, error } = await this.supabase.from('accounts').update(toRow(input, userId)).eq('id', id).select().single()
    if (error) throw error

    this._accounts.update(list => list.map(account => (account.id === id ? fromRow(data as AccountRow, account.balance) : account)))
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('accounts').delete().eq('id', id)
    if (error) throw error

    this._accounts.update(list => list.filter(account => account.id !== id))
  }
}
