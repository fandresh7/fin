export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  parentId: string | null
  icon: string | null
  isArchived: boolean
}

export interface CategoryRow {
  id: string
  name: string
  type: CategoryType
  parent_id: string | null
  icon: string | null
  is_archived: boolean
}
