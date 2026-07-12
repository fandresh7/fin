import { Component, inject, input, output, signal } from '@angular/core'
import { FormField, form, max, min, required, submit } from '@angular/forms/signals'
import { Account, AccountInput, AccountType, ACCOUNT_TYPE_LABELS } from '../../../core/accounts/account.model'
import { AccountsService } from '../../../core/accounts/accounts.service'

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]
const CURRENCIES = ['COP', 'USD', 'USDT']

function buildModel(account: Account | null): AccountInput {
  if (!account) {
    return { name: '', type: 'checking', currency: 'COP', institution: '', creditLimit: null, cutoffDay: null, paymentDueDay: null }
  }

  return {
    name: account.name,
    type: account.type,
    currency: account.currency ?? 'COP',
    institution: account.institution ?? '',
    creditLimit: account.creditLimit,
    cutoffDay: account.cutoffDay,
    paymentDueDay: account.paymentDueDay
  }
}

@Component({
  selector: 'app-account-form',
  imports: [FormField],
  template: `
    <div
      class="bg-ink/40 fixed inset-0 z-50 flex justify-end"
      (click)="cancelled.emit()">
      <div
        class="shadow-elevated bg-surface flex h-full w-full max-w-md flex-col overflow-y-auto p-8"
        (click)="$event.stopPropagation()">
        <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">{{ account() ? 'Editar cuenta' : 'Nueva cuenta' }}</span>
        <h1 class="text-ink mt-2 text-[26px] font-bold">{{ account()?.name || 'Agrega una cuenta' }}</h1>

        <form
          class="mt-8 flex flex-1 flex-col gap-5"
          novalidate
          (submit)="handleSubmit($event)">
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Nombre</span>
            <input
              type="text"
              placeholder="Cuenta Nu"
              [formField]="accountForm.name"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            @if (accountForm.name().touched() && accountForm.name().invalid()) {
              <span class="text-negative text-sm">El nombre es obligatorio.</span>
            }
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Tipo</span>
            <select
              [formField]="accountForm.type"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              @for (type of accountTypes; track type) {
                <option [value]="type">{{ typeLabels[type] }}</option>
              }
            </select>
          </label>

          @if (model().type !== 'crypto_exchange') {
            <label class="flex flex-col gap-2">
              <span class="text-muted text-sm font-medium">Moneda</span>
              <select
                [formField]="accountForm.currency"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
                @for (currency of currencies; track currency) {
                  <option [value]="currency">{{ currency }}</option>
                }
              </select>
            </label>
          }

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Institución (opcional)</span>
            <input
              type="text"
              placeholder="Bancolombia, Nu, Binance…"
              [formField]="accountForm.institution"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          </label>

          @if (model().type === 'credit_card') {
            <label class="flex flex-col gap-2">
              <span class="text-muted text-sm font-medium">Cupo</span>
              <input
                type="number"
                step="1000"
                [formField]="accountForm.creditLimit"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            </label>

            <div class="flex gap-4">
              <label class="flex flex-1 flex-col gap-2">
                <span class="text-muted text-sm font-medium">Día de corte</span>
                <input
                  type="number"
                  [formField]="accountForm.cutoffDay"
                  class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
              </label>
              <label class="flex flex-1 flex-col gap-2">
                <span class="text-muted text-sm font-medium">Día de pago</span>
                <input
                  type="number"
                  [formField]="accountForm.paymentDueDay"
                  class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
              </label>
            </div>
          }

          @if (errorMessage()) {
            <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
          }

          <div class="mt-auto flex gap-3 pt-6">
            <button
              type="button"
              (click)="cancelled.emit()"
              class="border-ink text-ink hover:bg-ink flex-1 rounded-full border px-6 py-3.5 text-base font-semibold transition-colors duration-300 hover:text-white">
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="bg-primary hover:bg-primary-dark flex-1 rounded-full px-6 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
              {{ isSubmitting() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AccountForm {
  private readonly accountsService = inject(AccountsService)

  readonly account = input<Account | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  protected readonly accountTypes = ACCOUNT_TYPES
  protected readonly currencies = CURRENCIES
  protected readonly typeLabels = ACCOUNT_TYPE_LABELS

  protected readonly model = signal<AccountInput>(buildModel(this.account()))
  protected readonly accountForm = form(this.model, path => {
    required(path.name, { message: 'El nombre es obligatorio' })
    min(path.creditLimit, 0, { message: 'El cupo no puede ser negativo' })
    min(path.cutoffDay, 1, { message: 'Debe estar entre 1 y 31' })
    max(path.cutoffDay, 31, { message: 'Debe estar entre 1 y 31' })
    min(path.paymentDueDay, 1, { message: 'Debe estar entre 1 y 31' })
    max(path.paymentDueDay, 31, { message: 'Debe estar entre 1 y 31' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.accountForm, async () => {
      const input = this.model()

      if (input.type === 'credit_card' && (input.creditLimit === null || input.cutoffDay === null || input.paymentDueDay === null)) {
        this.errorMessage.set('Completa cupo, día de corte y día de pago para una tarjeta de crédito.')
        return
      }

      this.isSubmitting.set(true)
      try {
        const existing = this.account()
        if (existing) {
          await this.accountsService.update(existing.id, input)
        } else {
          await this.accountsService.create(input)
        }
        this.saved.emit()
      } catch {
        this.errorMessage.set('No se pudo guardar la cuenta. Intenta de nuevo.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
