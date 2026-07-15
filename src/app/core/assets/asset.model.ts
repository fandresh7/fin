export type AssetCategory = 'real_estate' | 'vehicle' | 'electronics' | 'valuable' | 'other'

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  currentValue: number
  currency: string
  lastUpdatedAt: string
  notes: string | null
}

export interface AssetInput {
  name: string
  category: AssetCategory
  currentValue: number
  currency: string
  lastUpdatedAt: string
  notes: string
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  real_estate: 'Inmueble',
  vehicle: 'Vehículo',
  electronics: 'Electrónica',
  valuable: 'Objeto de valor',
  other: 'Otro'
}

export interface AssetRow {
  id: string
  name: string
  category: AssetCategory
  current_value: number
  currency: string
  last_updated_at: string
  notes: string | null
}
