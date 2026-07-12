import { Component, computed, inject, input, output, signal } from '@angular/core'
import { FormField, form, min, required, submit } from '@angular/forms/signals'
import { AccountsService } from '../../../core/accounts/accounts.service'
import { CryptoTransaction, CryptoTransactionInput, CryptoTransactionType, CRYPTO_TRANSACTION_TYPE_LABELS } from '../../../core/crypto/crypto.model'
import { CryptoService } from '../../../core/crypto/crypto.service'

const TYPES = Object.keys(CRYPTO_TRANSACTION_TYPE_LABELS) as CryptoTransactionType[]
const FIAT_CURRENCIES = ['COP', 'USD', 'USDT']

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function buildModel(tx: CryptoTransaction | null, defaultAccountId: string): CryptoTransactionInput {
  if (!tx) {
    return { accountId: defaultAccountId, assetSymbol: '', type: 'buy', quantity: 0, pricePerUnit: null, fiatCurrency: 'COP', fee: 0, notes: '', occurredAt: todayIso() }
  }

  return {
    accountId: tx.accountId,
    assetSymbol: tx.assetSymbol,
    type: tx.type,
    quantity: tx.quantity,
    pricePerUnit: tx.pricePerUnit,
    fiatCurrency: tx.fiatCurrency ?? 'COP',
    fee: tx.fee,
    notes: tx.notes ?? '',
    occurredAt: tx.occurredAt.slice(0, 10)
  }
}

@Component({
  selector: 'app-crypto-transaction-form',
  imports: [FormField],
  template: `
    <div
      class="bg-ink/40 fixed inset-0 z-50 flex justify-end"
      (click)="cancelled.emit()">
      <div
        class="shadow-elevated bg-surface flex h-full w-full max-w-md flex-col overflow-y-auto p-8"
        (click)="$event.stopPropagation()">
        <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">{{ transaction() ? 'Editar movimiento cripto' : 'Nuevo movimiento cripto' }}</span>
        <h1 class="text-ink mt-2 text-[26px] font-bold">{{ transaction() ? 'Editar' : 'Agrega un movimiento' }}</h1>

        <form
          class="mt-8 flex flex-1 flex-col gap-5"
          novalidate
          (submit)="handleSubmit($event)">
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Cuenta</span>
            <select
              [formField]="txForm.accountId"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              <option value="">Selecciona una cuenta</option>
              @for (account of cryptoAccounts(); track account.id) {
                <option [value]="account.id">{{ account.name }}</option>
              }
            </select>
          </label>

          <div class="flex gap-4">
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Activo</span>
              <input
                type="text"
                placeholder="BTC"
                [formField]="txForm.assetSymbol"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base uppercase outline-none" />
            </label>
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Tipo</span>
              <select
                [formField]="txForm.type"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
                @for (type of types; track type) {
                  <option [value]="type">{{ typeLabels[type] }}</option>
                }
              </select>
            </label>
          </div>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Cantidad</span>
            <input
              type="number"
              step="0.00000001"
              [formField]="txForm.quantity"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            @if (txForm.quantity().touched() && txForm.quantity().invalid()) {
              <span class="text-negative text-sm">Ingresa una cantidad mayor a cero.</span>
            }
          </label>

          <div class="flex gap-4">
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Precio unitario (opcional)</span>
              <input
                type="number"
                step="0.01"
                [formField]="txForm.pricePerUnit"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            </label>
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Moneda</span>
              <select
                [formField]="txForm.fiatCurrency"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
                @for (currency of fiatCurrencies; track currency) {
                  <option [value]="currency">{{ currency }}</option>
                }
              </select>
            </label>
          </div>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Fecha</span>
            <input
              type="date"
              [formField]="txForm.occurredAt"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Notas (opcional)</span>
            <input
              type="text"
              [formField]="txForm.notes"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          </label>

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
export class CryptoTransactionForm {
  private readonly cryptoService = inject(CryptoService)
  private readonly accountsService = inject(AccountsService)

  readonly transaction = input<CryptoTransaction | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  protected readonly types = TYPES
  protected readonly typeLabels = CRYPTO_TRANSACTION_TYPE_LABELS
  protected readonly fiatCurrencies = FIAT_CURRENCIES
  protected readonly cryptoAccounts = computed(() => this.accountsService.accounts().filter(account => account.type === 'crypto_exchange'))

  protected readonly model = signal<CryptoTransactionInput>(buildModel(this.transaction(), this.accountsService.accounts().find(a => a.type === 'crypto_exchange')?.id ?? ''))
  protected readonly txForm = form(this.model, path => {
    required(path.accountId, { message: 'Selecciona una cuenta' })
    required(path.assetSymbol, { message: 'Ingresa el símbolo del activo' })
    required(path.quantity, { message: 'La cantidad es obligatoria' })
    min(path.quantity, 0.00000001, { message: 'Ingresa una cantidad mayor a cero' })
    required(path.occurredAt, { message: 'La fecha es obligatoria' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.txForm, async () => {
      this.isSubmitting.set(true)
      try {
        const existing = this.transaction()
        if (existing) {
          await this.cryptoService.update(existing.id, this.model())
        } else {
          await this.cryptoService.create(this.model())
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
