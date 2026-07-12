export type CryptoTransactionType = 'buy' | 'sell' | 'deposit' | 'withdraw' | 'swap_in' | 'swap_out'

export interface CryptoHolding {
  accountId: string
  assetSymbol: string
  quantity: number
}

export interface CryptoTransaction {
  id: string
  accountId: string
  assetSymbol: string
  type: CryptoTransactionType
  quantity: number
  pricePerUnit: number | null
  fiatCurrency: string | null
  fee: number
  notes: string | null
  occurredAt: string
}

export interface CryptoTransactionInput {
  accountId: string
  assetSymbol: string
  type: CryptoTransactionType
  quantity: number
  pricePerUnit: number | null
  fiatCurrency: string
  fee: number
  notes: string
  occurredAt: string
}

export const CRYPTO_TRANSACTION_TYPE_LABELS: Record<CryptoTransactionType, string> = {
  buy: 'Compra',
  sell: 'Venta',
  deposit: 'Depósito',
  withdraw: 'Retiro',
  swap_in: 'Swap (entrada)',
  swap_out: 'Swap (salida)'
}

export interface CryptoHoldingRow {
  account_id: string
  asset_symbol: string
  quantity: number
}

export interface CryptoTransactionRow {
  id: string
  account_id: string
  asset_symbol: string
  type: CryptoTransactionType
  quantity: number
  price_per_unit: number | null
  fiat_currency: string | null
  fee: number
  notes: string | null
  occurred_at: string
}
