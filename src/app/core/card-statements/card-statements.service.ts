import { Service, inject, signal } from '@angular/core'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { CardStatement, CardStatementInput, CardStatementRow, CardStatementUpdateInput } from './card-statement.model'

function fromRow(row: CardStatementRow): CardStatement {
  return {
    id: row.id,
    accountId: row.account_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    dueDate: row.due_date,
    status: row.status,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount
  }
}

@Service()
export class CardStatementsService {
  private readonly supabase = inject(SupabaseClientService).client

  private readonly _statements = signal<CardStatement[]>([])
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly statements = this._statements.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(): Promise<void> {
    this._isLoading.set(true)
    this._error.set(null)

    const { data, error } = await this.supabase.from('card_statements').select('*').order('period_start', { ascending: false })

    if (error) {
      this._error.set('No se pudieron cargar los ciclos de facturación.')
      this._isLoading.set(false)
      return
    }

    this._statements.set((data as CardStatementRow[]).map(fromRow))
    this._isLoading.set(false)
  }

  async create(input: CardStatementInput): Promise<void> {
    const { data, error } = await this.supabase.from('card_statements').insert({ account_id: input.accountId, period_start: input.periodStart, period_end: input.periodEnd, due_date: input.dueDate }).select().single()
    if (error) throw error

    this._statements.update(list => [fromRow(data as CardStatementRow), ...list])
  }

  async update(id: string, input: CardStatementUpdateInput): Promise<void> {
    const { data, error } = await this.supabase.from('card_statements').update({ status: input.status, paid_amount: input.paidAmount }).eq('id', id).select().single()
    if (error) throw error

    const updated = fromRow(data as CardStatementRow)
    this._statements.update(list => list.map(statement => (statement.id === id ? updated : statement)))
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('card_statements').delete().eq('id', id)
    if (error) throw error

    this._statements.update(list => list.filter(statement => statement.id !== id))
  }
}
