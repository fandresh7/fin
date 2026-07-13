import { Component, computed, inject, signal } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { AccountsService } from '../../core/accounts/accounts.service'
import { CategoriesService } from '../../core/categories/categories.service'
import { formatFrequency, RecurringTransaction } from '../../core/recurring-transactions/recurring-transaction.model'
import { RecurringTransactionsService } from '../../core/recurring-transactions/recurring-transactions.service'
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog'
import { RecurringForm } from './recurring-form/recurring-form'

@Component({
  selector: 'app-recurring-page',
  imports: [RecurringForm, ConfirmDialog, DecimalPipe],
  templateUrl: './recurring-page.html'
})
export class RecurringPage {
  protected readonly recurringService = inject(RecurringTransactionsService)
  protected readonly accountsService = inject(AccountsService)
  protected readonly categoriesService = inject(CategoriesService)

  protected readonly formatFrequency = formatFrequency

  protected readonly accountNameById = computed(() => new Map(this.accountsService.accounts().map(account => [account.id, account.name])))
  protected readonly categoryNameById = computed(() => new Map(this.categoriesService.categories().map(category => [category.id, category.name])))

  protected readonly isFormOpen = signal(false)
  protected readonly editingRule = signal<RecurringTransaction | null>(null)
  protected readonly deletingRule = signal<RecurringTransaction | null>(null)
  protected readonly isDeleting = signal(false)

  constructor() {
    this.accountsService.load()
    this.categoriesService.load()
    this.recurringService.load()
  }

  protected accountName(id: string): string {
    return this.accountNameById().get(id) ?? '—'
  }

  protected categoryName(id: string | null): string {
    if (!id) return '—'
    return this.categoryNameById().get(id) ?? '—'
  }

  protected openCreateForm(): void {
    this.editingRule.set(null)
    this.isFormOpen.set(true)
  }

  protected openEditForm(rule: RecurringTransaction): void {
    this.editingRule.set(rule)
    this.isFormOpen.set(true)
  }

  protected closeForm(): void {
    this.isFormOpen.set(false)
    this.editingRule.set(null)
  }

  protected toggleActive(rule: RecurringTransaction): void {
    this.recurringService.setActive(rule.id, !rule.isActive)
  }

  protected async handleDeleteConfirmed(): Promise<void> {
    const rule = this.deletingRule()
    if (!rule) return

    this.isDeleting.set(true)
    try {
      await this.recurringService.remove(rule.id)
      this.deletingRule.set(null)
    } finally {
      this.isDeleting.set(false)
    }
  }
}
