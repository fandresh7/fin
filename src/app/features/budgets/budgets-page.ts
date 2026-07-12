import { Component, computed, inject, signal } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { Budget } from '../../core/budgets/budget.model'
import { BudgetsService } from '../../core/budgets/budgets.service'
import { CategoriesService } from '../../core/categories/categories.service'
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog'
import { BudgetForm } from './budget-form/budget-form'

@Component({
  selector: 'app-budgets-page',
  imports: [BudgetForm, ConfirmDialog, DecimalPipe],
  templateUrl: './budgets-page.html'
})
export class BudgetsPage {
  protected readonly budgetsService = inject(BudgetsService)
  protected readonly categoriesService = inject(CategoriesService)

  protected readonly categoryNameById = computed(() => new Map(this.categoriesService.categories().map(category => [category.id, category.name])))

  protected readonly isFormOpen = signal(false)
  protected readonly editingBudget = signal<Budget | null>(null)
  protected readonly deletingBudget = signal<Budget | null>(null)
  protected readonly isDeleting = signal(false)

  constructor() {
    this.categoriesService.load()
    this.budgetsService.load()
  }

  protected categoryName(id: string): string {
    return this.categoryNameById().get(id) ?? '—'
  }

  protected progressPercent(budget: Budget): number {
    if (budget.amount <= 0) return 0
    return Math.min(100, Math.round((budget.spentAmount / budget.amount) * 100))
  }

  protected openCreateForm(): void {
    this.editingBudget.set(null)
    this.isFormOpen.set(true)
  }

  protected openEditForm(budget: Budget): void {
    this.editingBudget.set(budget)
    this.isFormOpen.set(true)
  }

  protected closeForm(): void {
    this.isFormOpen.set(false)
    this.editingBudget.set(null)
  }

  protected async handleDeleteConfirmed(): Promise<void> {
    const budget = this.deletingBudget()
    if (!budget) return

    this.isDeleting.set(true)
    try {
      await this.budgetsService.remove(budget.id)
      this.deletingBudget.set(null)
    } finally {
      this.isDeleting.set(false)
    }
  }
}
