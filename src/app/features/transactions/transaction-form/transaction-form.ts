import { Component, computed, inject, input, linkedSignal, output, signal, untracked } from '@angular/core'
import { FormField, form, min, required, submit } from '@angular/forms/signals'
import { Modal } from '../../../shared/components/modal/modal'
import { AccountsService } from '../../../core/accounts/accounts.service'
import { CardStatementsService } from '../../../core/card-statements/card-statements.service'
import { CategoriesService } from '../../../core/categories/categories.service'
import { Transaction, TransactionInput, TransactionType } from '../../../core/transactions/transaction.model'
import { TransactionsService } from '../../../core/transactions/transactions.service'

interface TransactionFormModel {
  type: TransactionType
  accountId: string
  transferAccountId: string
  categoryId: string
  amount: number | null
  description: string
  occurredAt: string
  cardStatementId: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function buildModel(transaction: Transaction | null, defaultAccountId: string): TransactionFormModel {
  if (!transaction) {
    return { type: 'expense', accountId: defaultAccountId, transferAccountId: '', categoryId: '', amount: null, description: '', occurredAt: todayIso(), cardStatementId: '' }
  }

  return {
    type: transaction.type,
    accountId: transaction.accountId,
    transferAccountId: transaction.transferAccountId ?? '',
    categoryId: transaction.categoryId ?? '',
    amount: transaction.amount,
    description: transaction.description ?? '',
    occurredAt: transaction.occurredAt,
    cardStatementId: transaction.cardStatementId ?? ''
  }
}

@Component({
  selector: 'app-transaction-form',
  imports: [FormField, Modal],
  template: `
    <app-modal
      [title]="transaction() ? 'Editar' : 'Agrega un movimiento'"
      [eyebrow]="transaction() ? 'Editar movimiento' : 'Nuevo movimiento'"
      (closed)="cancelled.emit()">
      <form
        id="transactionForm"
        class="flex flex-col gap-5"
        novalidate
        (submit)="handleSubmit($event)">
        <div class="bg-paper flex gap-2 rounded-full p-1">
          @for (option of typeOptions; track option.value) {
            <button
              type="button"
              (click)="setType(option.value)"
              [class]="
                model().type === option.value
                  ? 'bg-primary flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors duration-200'
                  : 'text-muted hover:text-ink flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200'
              ">
              {{ option.label }}
            </button>
          }
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-muted text-sm font-medium">{{ model().type === 'transfer' ? 'Cuenta origen' : 'Cuenta' }}</span>
          <select
            [formField]="txForm.accountId"
            class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
            <option value="">Selecciona una cuenta</option>
            @for (account of accountsService.accounts(); track account.id) {
              <option [value]="account.id">{{ account.name }}</option>
            }
          </select>
          @if (txForm.accountId().touched() && txForm.accountId().invalid()) {
            <span class="text-negative text-sm">Selecciona una cuenta.</span>
          }
        </label>

        @if (model().type === 'transfer') {
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Cuenta destino</span>
            <select
              [formField]="txForm.transferAccountId"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              <option value="">Selecciona una cuenta</option>
              @for (account of destinationAccounts(); track account.id) {
                <option [value]="account.id">{{ account.name }}</option>
              }
            </select>
          </label>
        } @else {
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Categoría</span>
            <select
              [formField]="txForm.categoryId"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              <option value="">Selecciona una categoría</option>
              @for (category of categoriesForType(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>
        }

        @if (model().type === 'expense' && statementsForAccount().length > 0) {
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Ciclo de facturación (opcional)</span>
            <select
              [formField]="txForm.cardStatementId"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              <option value="">Sin vincular</option>
              @for (statement of statementsForAccount(); track statement.id) {
                <option [value]="statement.id">{{ statement.periodStart }} → {{ statement.periodEnd }}</option>
              }
            </select>
          </label>
        }

        <label class="flex flex-col gap-2">
          <span class="text-muted text-sm font-medium">Monto</span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            [formField]="txForm.amount"
            class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          @if (txForm.amount().touched() && txForm.amount().invalid()) {
            <span class="text-negative text-sm">Ingresa un monto mayor a cero.</span>
          }
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-muted text-sm font-medium">Fecha</span>
          <input
            type="date"
            [formField]="txForm.occurredAt"
            class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          @if (txForm.occurredAt().touched() && txForm.occurredAt().invalid()) {
            <span class="text-negative text-sm">La fecha es obligatoria.</span>
          }
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-muted text-sm font-medium">Descripción (opcional)</span>
          <input
            type="text"
            placeholder="Supermercado, nómina, taxi…"
            [formField]="txForm.description"
            class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
        </label>

        @if (errorMessage()) {
          <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
        }
      </form>
      <button
        ngProjectAs="[modal-footer]"
        type="button"
        (click)="cancelled.emit()"
        class="border-ink text-ink hover:bg-ink flex-1 rounded-full border px-6 py-3.5 text-base font-semibold transition-colors duration-300 hover:text-white">
        Cancelar
      </button>
      <button
        ngProjectAs="[modal-footer]"
        type="submit"
        form="transactionForm"
        [disabled]="isSubmitting()"
        class="bg-primary hover:bg-primary-dark flex-1 rounded-full px-6 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
        {{ isSubmitting() ? 'Guardando…' : 'Guardar' }}
      </button>
    </app-modal>
  `
})
export class TransactionForm {
  private readonly transactionsService = inject(TransactionsService)
  protected readonly accountsService = inject(AccountsService)
  protected readonly categoriesService = inject(CategoriesService)
  protected readonly cardStatementsService = inject(CardStatementsService)

  readonly transaction = input<Transaction | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  constructor() {
    this.cardStatementsService.load()
  }

  protected readonly typeOptions: { value: TransactionType; label: string }[] = [
    { value: 'expense', label: 'Gasto' },
    { value: 'income', label: 'Ingreso' },
    { value: 'transfer', label: 'Transferencia' }
  ]

  // linkedSignal, not signal + eager buildModel: reading an @Input in a field initializer sees
  // its default, not what the parent bound, since Angular sets real input values after
  // construction. The accounts list read is untracked so an unrelated background refresh of
  // that list can't reset the form and discard whatever the user has typed so far.
  protected readonly model = linkedSignal<TransactionFormModel>(() => buildModel(this.transaction(), untracked(() => this.accountsService.accounts())[0]?.id ?? ''))
  protected readonly txForm = form(this.model, path => {
    required(path.accountId, { message: 'Selecciona una cuenta' })
    required(path.amount, { message: 'El monto es obligatorio' })
    min(path.amount, 0.01, { message: 'El monto debe ser mayor a cero' })
    required(path.occurredAt, { message: 'La fecha es obligatoria' })
  })

  protected readonly destinationAccounts = computed(() => this.accountsService.accounts().filter(account => account.id !== this.model().accountId))

  protected readonly categoriesForType = computed(() => {
    const type = this.model().type
    if (type === 'transfer') return []
    return this.categoriesService.categories().filter(category => category.type === type)
  })

  protected readonly statementsForAccount = computed(() => {
    const account = this.accountsService.accounts().find(a => a.id === this.model().accountId)
    if (!account || account.type !== 'credit_card') return []
    return this.cardStatementsService.statements().filter(statement => statement.accountId === account.id)
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected setType(type: TransactionType): void {
    this.model.update(current => ({ ...current, type, categoryId: '', transferAccountId: '' }))
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.txForm, async () => {
      const current = this.model()

      if (current.type === 'transfer' && !current.transferAccountId) {
        this.errorMessage.set('Selecciona la cuenta destino.')
        return
      }
      if (current.type !== 'transfer' && !current.categoryId) {
        this.errorMessage.set('Selecciona una categoría.')
        return
      }

      const account = this.accountsService.accounts().find(a => a.id === current.accountId)
      const isValidStatement = this.statementsForAccount().some(statement => statement.id === current.cardStatementId)
      const input: TransactionInput = {
        accountId: current.accountId,
        categoryId: current.type === 'transfer' ? null : current.categoryId,
        type: current.type,
        amount: current.amount as number,
        currency: account?.currency ?? 'COP',
        description: current.description,
        occurredAt: current.occurredAt,
        transferAccountId: current.type === 'transfer' ? current.transferAccountId : null,
        cardStatementId: current.type === 'expense' && isValidStatement ? current.cardStatementId : null
      }

      this.isSubmitting.set(true)
      try {
        const existing = this.transaction()
        if (existing) {
          await this.transactionsService.update(existing.id, input)
        } else {
          await this.transactionsService.create(input)
        }
        this.saved.emit()
      } catch {
        this.errorMessage.set('No se pudo guardar el movimiento. Intenta de nuevo.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
