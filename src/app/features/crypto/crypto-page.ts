import { Component, computed, inject, signal } from '@angular/core'
import { AccountsService } from '../../core/accounts/accounts.service'
import { CryptoTransaction, CRYPTO_TRANSACTION_TYPE_LABELS } from '../../core/crypto/crypto.model'
import { CryptoService } from '../../core/crypto/crypto.service'
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog'
import { CryptoTransactionForm } from './crypto-transaction-form/crypto-transaction-form'

@Component({
  selector: 'app-crypto-page',
  imports: [CryptoTransactionForm, ConfirmDialog],
  templateUrl: './crypto-page.html'
})
export class CryptoPage {
  protected readonly accountsService = inject(AccountsService)
  protected readonly cryptoService = inject(CryptoService)

  protected readonly typeLabels = CRYPTO_TRANSACTION_TYPE_LABELS

  protected readonly cryptoAccounts = computed(() => this.accountsService.accounts().filter(account => account.type === 'crypto_exchange'))
  protected readonly selectedAccountId = signal<string | null>(null)

  protected readonly holdingsForSelectedAccount = computed(() => this.cryptoService.holdings().filter(holding => holding.accountId === this.selectedAccountId()))
  protected readonly transactionsForSelectedAccount = computed(() => this.cryptoService.transactions().filter(tx => tx.accountId === this.selectedAccountId()))

  protected readonly isFormOpen = signal(false)
  protected readonly editingTransaction = signal<CryptoTransaction | null>(null)
  protected readonly deletingTransaction = signal<CryptoTransaction | null>(null)
  protected readonly isDeleting = signal(false)

  constructor() {
    this.accountsService.load()
    this.cryptoService.load()
  }

  protected accountName(id: string): string {
    return this.accountsService.accounts().find(account => account.id === id)?.name ?? '—'
  }

  protected selectAccount(accountId: string): void {
    this.selectedAccountId.set(this.selectedAccountId() === accountId ? null : accountId)
  }

  protected openCreateForm(): void {
    this.editingTransaction.set(null)
    this.isFormOpen.set(true)
  }

  protected openEditForm(tx: CryptoTransaction): void {
    this.editingTransaction.set(tx)
    this.isFormOpen.set(true)
  }

  protected closeForm(): void {
    this.isFormOpen.set(false)
    this.editingTransaction.set(null)
  }

  protected async handleDeleteConfirmed(): Promise<void> {
    const tx = this.deletingTransaction()
    if (!tx) return

    this.isDeleting.set(true)
    try {
      await this.cryptoService.remove(tx.id)
      this.deletingTransaction.set(null)
    } finally {
      this.isDeleting.set(false)
    }
  }
}
