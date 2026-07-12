import { Service, inject, signal } from '@angular/core'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { CryptoHolding, CryptoHoldingRow, CryptoTransaction, CryptoTransactionInput, CryptoTransactionRow } from './crypto.model'

function holdingFromRow(row: CryptoHoldingRow): CryptoHolding {
  return { accountId: row.account_id, assetSymbol: row.asset_symbol, quantity: row.quantity }
}

function transactionFromRow(row: CryptoTransactionRow): CryptoTransaction {
  return {
    id: row.id,
    accountId: row.account_id,
    assetSymbol: row.asset_symbol,
    type: row.type,
    quantity: row.quantity,
    pricePerUnit: row.price_per_unit,
    fiatCurrency: row.fiat_currency,
    fee: row.fee,
    notes: row.notes,
    occurredAt: row.occurred_at
  }
}

function toRow(input: CryptoTransactionInput) {
  return {
    account_id: input.accountId,
    asset_symbol: input.assetSymbol.toUpperCase(),
    type: input.type,
    quantity: input.quantity,
    price_per_unit: input.pricePerUnit,
    fiat_currency: input.fiatCurrency || null,
    fee: input.fee,
    notes: input.notes || null,
    occurred_at: input.occurredAt
  }
}

@Service()
export class CryptoService {
  private readonly supabase = inject(SupabaseClientService).client

  private readonly _holdings = signal<CryptoHolding[]>([])
  private readonly _transactions = signal<CryptoTransaction[]>([])
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly holdings = this._holdings.asReadonly()
  readonly transactions = this._transactions.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(): Promise<void> {
    this._isLoading.set(true)
    this._error.set(null)

    const [holdingsResult, transactionsResult] = await Promise.all([this.supabase.from('crypto_holdings').select('*'), this.supabase.from('crypto_transactions').select('*').order('occurred_at', { ascending: false })])

    if (holdingsResult.error || transactionsResult.error) {
      this._error.set('No se pudo cargar la información de cripto.')
      this._isLoading.set(false)
      return
    }

    this._holdings.set((holdingsResult.data as CryptoHoldingRow[]).map(holdingFromRow))
    this._transactions.set((transactionsResult.data as CryptoTransactionRow[]).map(transactionFromRow))
    this._isLoading.set(false)
  }

  async create(input: CryptoTransactionInput): Promise<void> {
    const { error } = await this.supabase.from('crypto_transactions').insert(toRow(input))
    if (error) throw error

    await this.load()
  }

  async update(id: string, input: CryptoTransactionInput): Promise<void> {
    const { error } = await this.supabase.from('crypto_transactions').update(toRow(input)).eq('id', id)
    if (error) throw error

    await this.load()
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('crypto_transactions').delete().eq('id', id)
    if (error) throw error

    await this.load()
  }
}
