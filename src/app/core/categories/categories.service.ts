import { Service, inject, signal } from '@angular/core'
import { AuthService } from '../auth/auth.service'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { Category, CategoryInput, CategoryRow } from './category.model'

function fromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    parentId: row.parent_id,
    icon: row.icon,
    isArchived: row.is_archived
  }
}

@Service()
export class CategoriesService {
  private readonly supabase = inject(SupabaseClientService).client
  private readonly auth = inject(AuthService)

  private readonly _categories = signal<Category[]>([])
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly categories = this._categories.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(): Promise<void> {
    this._isLoading.set(true)
    this._error.set(null)

    const { data, error } = await this.supabase.from('categories').select('*').eq('is_archived', false).order('name', { ascending: true })

    if (error) {
      this._error.set('No se pudieron cargar las categorías.')
      this._isLoading.set(false)
      return
    }

    this._categories.set((data as CategoryRow[]).map(fromRow))
    this._isLoading.set(false)
  }

  async create(input: CategoryInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { data, error } = await this.supabase.from('categories').insert({ user_id: userId, name: input.name, type: input.type }).select().single()
    if (error) throw error

    this._categories.update(list => [...list, fromRow(data as CategoryRow)].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async update(id: string, input: CategoryInput): Promise<void> {
    const { data, error } = await this.supabase.from('categories').update({ name: input.name, type: input.type }).eq('id', id).select().single()
    if (error) throw error

    const updated = fromRow(data as CategoryRow)
    this._categories.update(list => list.map(category => (category.id === id ? updated : category)).sort((a, b) => a.name.localeCompare(b.name)))
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('categories').delete().eq('id', id)
    if (error) throw error

    this._categories.update(list => list.filter(category => category.id !== id))
  }
}
