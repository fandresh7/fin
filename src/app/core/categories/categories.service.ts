import { Service, inject, signal } from '@angular/core'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { Category, CategoryRow } from './category.model'

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

  private readonly _categories = signal<Category[]>([])
  private readonly _isLoading = signal(false)

  readonly categories = this._categories.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()

  async load(): Promise<void> {
    this._isLoading.set(true)

    const { data, error } = await this.supabase.from('categories').select('*').eq('is_archived', false).order('name', { ascending: true })

    if (!error) {
      this._categories.set((data as CategoryRow[]).map(fromRow))
    }

    this._isLoading.set(false)
  }
}
