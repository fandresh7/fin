import { Component, computed, inject, signal } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { AccountsService } from '../../core/accounts/accounts.service'
import { CardStatement, CARD_STATEMENT_STATUS_LABELS } from '../../core/card-statements/card-statement.model'
import { CardStatementsService } from '../../core/card-statements/card-statements.service'
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog'
import { CreateStatementForm } from './card-statement-form/create-statement-form'
import { EditStatementForm } from './card-statement-form/edit-statement-form'

@Component({
  selector: 'app-cards-page',
  imports: [CreateStatementForm, EditStatementForm, ConfirmDialog, DecimalPipe],
  templateUrl: './cards-page.html'
})
export class CardsPage {
  protected readonly accountsService = inject(AccountsService)
  protected readonly cardStatementsService = inject(CardStatementsService)

  protected readonly statusLabels = CARD_STATEMENT_STATUS_LABELS

  protected readonly creditCardAccounts = computed(() => this.accountsService.accounts().filter(account => account.type === 'credit_card'))
  protected readonly selectedAccountId = signal<string | null>(null)
  protected readonly statementsForSelectedAccount = computed(() => this.cardStatementsService.statements().filter(statement => statement.accountId === this.selectedAccountId()))

  protected readonly isCreateFormOpen = signal(false)
  protected readonly editingStatement = signal<CardStatement | null>(null)
  protected readonly deletingStatement = signal<CardStatement | null>(null)
  protected readonly isDeleting = signal(false)

  constructor() {
    this.accountsService.load()
    this.cardStatementsService.load()
  }

  protected selectAccount(accountId: string): void {
    this.selectedAccountId.set(this.selectedAccountId() === accountId ? null : accountId)
  }

  protected accountName(id: string): string {
    return this.accountsService.accounts().find(account => account.id === id)?.name ?? '—'
  }

  protected closeCreateForm(): void {
    this.isCreateFormOpen.set(false)
  }

  protected async handleDeleteConfirmed(): Promise<void> {
    const statement = this.deletingStatement()
    if (!statement) return

    this.isDeleting.set(true)
    try {
      await this.cardStatementsService.remove(statement.id)
      this.deletingStatement.set(null)
    } finally {
      this.isDeleting.set(false)
    }
  }
}
