import { Component, computed, inject, signal } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { AccountsService } from '../../core/accounts/accounts.service'
import { CategoriesService } from '../../core/categories/categories.service'
import { Transaction } from '../../core/transactions/transaction.model'
import { TransactionsService } from '../../core/transactions/transactions.service'
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog'
import { TransactionForm } from './transaction-form/transaction-form'

@Component({
  selector: 'app-transactions-page',
  imports: [TransactionForm, ConfirmDialog, DecimalPipe],
  templateUrl: './transactions-page.html'
})
export class TransactionsPage {
  protected readonly transactionsService = inject(TransactionsService)
  protected readonly accountsService = inject(AccountsService)
  protected readonly categoriesService = inject(CategoriesService)

  protected readonly isFormOpen = signal(false)
  protected readonly editingTransaction = signal<Transaction | null>(null)
  protected readonly deletingTransaction = signal<Transaction | null>(null)
  protected readonly isDeleting = signal(false)

  protected readonly accountNameById = computed(() => new Map(this.accountsService.accounts().map(account => [account.id, account.name])))
  protected readonly categoryNameById = computed(() => new Map(this.categoriesService.categories().map(category => [category.id, category.name])))

  constructor() {
    this.accountsService.load()
    this.categoriesService.load()
    this.transactionsService.load()
  }

  protected accountName(id: string): string {
    return this.accountNameById().get(id) ?? '—'
  }

  protected categoryName(id: string | null): string | null {
    if (!id) return null
    return this.categoryNameById().get(id) ?? null
  }

  protected openCreateForm(): void {
    this.editingTransaction.set(null)
    this.isFormOpen.set(true)
  }

  protected openEditForm(transaction: Transaction): void {
    this.editingTransaction.set(transaction)
    this.isFormOpen.set(true)
  }

  protected closeForm(): void {
    this.isFormOpen.set(false)
    this.editingTransaction.set(null)
  }

  protected async handleDeleteConfirmed(): Promise<void> {
    const transaction = this.deletingTransaction()
    if (!transaction) return

    this.isDeleting.set(true)
    try {
      await this.transactionsService.remove(transaction.id)
      this.deletingTransaction.set(null)
    } finally {
      this.isDeleting.set(false)
    }
  }
}
