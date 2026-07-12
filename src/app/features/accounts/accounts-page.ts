import { Component, inject, signal } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { Account, ACCOUNT_TYPE_LABELS } from '../../core/accounts/account.model'
import { AccountsService } from '../../core/accounts/accounts.service'
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog'
import { NavIcon, NavIconName } from '../../shared/components/nav-icon/nav-icon'
import { AccountForm } from './account-form/account-form'

const ACCOUNT_TYPE_ICONS: Record<Account['type'], NavIconName> = {
  cash: 'wallet',
  checking: 'wallet',
  savings: 'wallet',
  credit_card: 'card',
  crypto_exchange: 'crypto',
  investment: 'budget',
  other: 'wallet'
}

@Component({
  selector: 'app-accounts-page',
  imports: [AccountForm, ConfirmDialog, NavIcon, DecimalPipe],
  templateUrl: './accounts-page.html'
})
export class AccountsPage {
  protected readonly accountsService = inject(AccountsService)

  protected readonly typeLabels = ACCOUNT_TYPE_LABELS
  protected readonly typeIcons = ACCOUNT_TYPE_ICONS

  protected readonly isFormOpen = signal(false)
  protected readonly editingAccount = signal<Account | null>(null)
  protected readonly deletingAccount = signal<Account | null>(null)
  protected readonly isDeleting = signal(false)

  constructor() {
    this.accountsService.load()
  }

  protected openCreateForm(): void {
    this.editingAccount.set(null)
    this.isFormOpen.set(true)
  }

  protected openEditForm(account: Account): void {
    this.editingAccount.set(account)
    this.isFormOpen.set(true)
  }

  protected closeForm(): void {
    this.isFormOpen.set(false)
    this.editingAccount.set(null)
  }

  protected async handleDeleteConfirmed(): Promise<void> {
    const account = this.deletingAccount()
    if (!account) return

    this.isDeleting.set(true)
    try {
      await this.accountsService.remove(account.id)
      this.deletingAccount.set(null)
    } finally {
      this.isDeleting.set(false)
    }
  }
}
