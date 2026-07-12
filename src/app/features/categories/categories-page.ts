import { Component, computed, inject, signal } from '@angular/core'
import { Category } from '../../core/categories/category.model'
import { CategoriesService } from '../../core/categories/categories.service'
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog'
import { CategoryForm } from './category-form/category-form'

@Component({
  selector: 'app-categories-page',
  imports: [CategoryForm, ConfirmDialog],
  templateUrl: './categories-page.html'
})
export class CategoriesPage {
  protected readonly categoriesService = inject(CategoriesService)

  protected readonly incomeCategories = computed(() => this.categoriesService.categories().filter(c => c.type === 'income'))
  protected readonly expenseCategories = computed(() => this.categoriesService.categories().filter(c => c.type === 'expense'))

  protected readonly isFormOpen = signal(false)
  protected readonly editingCategory = signal<Category | null>(null)
  protected readonly deletingCategory = signal<Category | null>(null)
  protected readonly isDeleting = signal(false)

  constructor() {
    this.categoriesService.load()
  }

  protected openCreateForm(): void {
    this.editingCategory.set(null)
    this.isFormOpen.set(true)
  }

  protected openEditForm(category: Category): void {
    this.editingCategory.set(category)
    this.isFormOpen.set(true)
  }

  protected closeForm(): void {
    this.isFormOpen.set(false)
    this.editingCategory.set(null)
  }

  protected async handleDeleteConfirmed(): Promise<void> {
    const category = this.deletingCategory()
    if (!category) return

    this.isDeleting.set(true)
    try {
      await this.categoriesService.remove(category.id)
      this.deletingCategory.set(null)
    } finally {
      this.isDeleting.set(false)
    }
  }
}
