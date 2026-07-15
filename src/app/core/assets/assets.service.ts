import { Service, inject, signal } from '@angular/core'
import { AuthService } from '../auth/auth.service'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { Asset, AssetInput, AssetRow } from './asset.model'

function fromRow(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    currentValue: row.current_value,
    currency: row.currency,
    lastUpdatedAt: row.last_updated_at,
    notes: row.notes
  }
}

function toRow(input: AssetInput) {
  return {
    name: input.name,
    category: input.category,
    current_value: input.currentValue,
    currency: input.currency,
    last_updated_at: input.lastUpdatedAt,
    notes: input.notes || null
  }
}

@Service()
export class AssetsService {
  private readonly supabase = inject(SupabaseClientService).client
  private readonly auth = inject(AuthService)

  private readonly _assets = signal<Asset[]>([])
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly assets = this._assets.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(): Promise<void> {
    this._isLoading.set(true)
    this._error.set(null)

    const { data, error } = await this.supabase.from('assets').select('*').order('current_value', { ascending: false })

    if (error) {
      this._error.set('No se pudo cargar tu patrimonio.')
      this._isLoading.set(false)
      return
    }

    this._assets.set((data as AssetRow[]).map(fromRow))
    this._isLoading.set(false)
  }

  async create(input: AssetInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { data, error } = await this.supabase
      .from('assets')
      .insert({ user_id: userId, ...toRow(input) })
      .select()
      .single()
    if (error) throw error

    this._assets.update(list => [...list, fromRow(data as AssetRow)].sort((a, b) => b.currentValue - a.currentValue))
  }

  async update(id: string, input: AssetInput): Promise<void> {
    const { data, error } = await this.supabase.from('assets').update(toRow(input)).eq('id', id).select().single()
    if (error) throw error

    const updated = fromRow(data as AssetRow)
    this._assets.update(list => list.map(asset => (asset.id === id ? updated : asset)).sort((a, b) => b.currentValue - a.currentValue))
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('assets').delete().eq('id', id)
    if (error) throw error

    this._assets.update(list => list.filter(asset => asset.id !== id))
  }
}
