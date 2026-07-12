import { Service, inject, signal } from '@angular/core'
import { AuthService } from '../auth/auth.service'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { Budget, BudgetInput, BudgetProgressRow } from './budget.model'

function fromRow(row: BudgetProgressRow): Budget {
  return {
    id: row.budget_id,
    categoryId: row.category_id,
    name: row.name,
    amount: row.amount,
    currency: row.currency,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    spentAmount: row.spent_amount
  }
}

function toRow(input: BudgetInput, userId: string) {
  return {
    user_id: userId,
    category_id: input.categoryId,
    name: input.name || null,
    amount: input.amount,
    currency: input.currency,
    period_start: input.periodStart,
    period_end: input.periodEnd
  }
}

@Service()
export class BudgetsService {
  private readonly supabase = inject(SupabaseClientService).client
  private readonly auth = inject(AuthService)

  private readonly _budgets = signal<Budget[]>([])
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly budgets = this._budgets.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(): Promise<void> {
    this._isLoading.set(true)
    this._error.set(null)

    const { data, error } = await this.supabase.from('budget_progress').select('*').order('period_start', { ascending: false })

    if (error) {
      this._error.set('No se pudieron cargar los presupuestos.')
      this._isLoading.set(false)
      return
    }

    this._budgets.set((data as BudgetProgressRow[]).map(fromRow))
    this._isLoading.set(false)
  }

  async create(input: BudgetInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { error } = await this.supabase.from('budgets').insert(toRow(input, userId))
    if (error) throw error

    await this.load()
  }

  async update(id: string, input: BudgetInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { error } = await this.supabase.from('budgets').update(toRow(input, userId)).eq('id', id)
    if (error) throw error

    await this.load()
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('budgets').delete().eq('id', id)
    if (error) throw error

    this._budgets.update(list => list.filter(budget => budget.id !== id))
  }
}
