import { Service, inject, signal } from '@angular/core'
import { AuthService } from '../auth/auth.service'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { RecurringTransaction, RecurringTransactionInput, RecurringTransactionRow } from './recurring-transaction.model'

function fromRow(row: RecurringTransactionRow): RecurringTransaction {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    intervalUnit: row.interval_unit,
    intervalCount: row.interval_count,
    startDate: row.start_date,
    nextRunDate: row.next_run_date,
    endDate: row.end_date,
    isActive: row.is_active
  }
}

@Service()
export class RecurringTransactionsService {
  private readonly supabase = inject(SupabaseClientService).client
  private readonly auth = inject(AuthService)

  private readonly _rules = signal<RecurringTransaction[]>([])
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly rules = this._rules.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(): Promise<void> {
    this._isLoading.set(true)
    this._error.set(null)

    const { data, error } = await this.supabase.from('recurring_transactions').select('*').order('next_run_date', { ascending: true })

    if (error) {
      this._error.set('No se pudieron cargar los movimientos recurrentes.')
      this._isLoading.set(false)
      return
    }

    this._rules.set((data as RecurringTransactionRow[]).map(fromRow))
    this._isLoading.set(false)
  }

  async create(input: RecurringTransactionInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { data, error } = await this.supabase
      .from('recurring_transactions')
      .insert({
        user_id: userId,
        account_id: input.accountId,
        category_id: input.categoryId || null,
        type: input.type,
        amount: input.amount,
        currency: input.currency,
        description: input.description || null,
        interval_unit: input.intervalUnit,
        interval_count: input.intervalCount,
        start_date: input.startDate,
        next_run_date: input.startDate,
        end_date: input.endDate || null
      })
      .select()
      .single()
    if (error) throw error

    this._rules.update(list => [...list, fromRow(data as RecurringTransactionRow)].sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate)))
  }

  // Deliberately leaves next_run_date untouched — the schedule's current position is owned by
  // the cron job, not by editing the rule's definition.
  async update(id: string, input: RecurringTransactionInput): Promise<void> {
    const { data, error } = await this.supabase
      .from('recurring_transactions')
      .update({
        account_id: input.accountId,
        category_id: input.categoryId || null,
        type: input.type,
        amount: input.amount,
        currency: input.currency,
        description: input.description || null,
        interval_unit: input.intervalUnit,
        interval_count: input.intervalCount,
        start_date: input.startDate,
        end_date: input.endDate || null
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    const updated = fromRow(data as RecurringTransactionRow)
    this._rules.update(list => list.map(rule => (rule.id === id ? updated : rule)).sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate)))
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase.from('recurring_transactions').update({ is_active: isActive }).eq('id', id)
    if (error) throw error

    this._rules.update(list => list.map(rule => (rule.id === id ? { ...rule, isActive } : rule)))
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('recurring_transactions').delete().eq('id', id)
    if (error) throw error

    this._rules.update(list => list.filter(rule => rule.id !== id))
  }
}
