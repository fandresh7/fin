import { Component, computed, inject, input, linkedSignal, output, signal, untracked } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { FormField, form, min, required, submit } from '@angular/forms/signals'
import { Modal } from '../../../shared/components/modal/modal'
import { AccountsService } from '../../../core/accounts/accounts.service'
import { CategoriesService } from '../../../core/categories/categories.service'
import { computeCatchUp, RecurrenceIntervalUnit, RecurringTransaction, RecurringTransactionInput, RecurringTransactionType } from '../../../core/recurring-transactions/recurring-transaction.model'
import { RecurringTransactionsService } from '../../../core/recurring-transactions/recurring-transactions.service'
import { TransactionsService } from '../../../core/transactions/transactions.service'

type Preset = 'weekly' | 'biweekly' | 'monthly' | 'custom'

interface PendingOccurrence {
  date: string
  selected: boolean
}

interface RecurringFormModel {
  type: RecurringTransactionType
  accountId: string
  categoryId: string
  amount: number | null
  description: string
  preset: Preset
  intervalUnit: RecurrenceIntervalUnit
  intervalCount: number
  startDate: string
  endDate: string
}

const PRESET_INTERVALS: Record<Exclude<Preset, 'custom'>, { unit: RecurrenceIntervalUnit; count: number }> = {
  weekly: { unit: 'week', count: 1 },
  biweekly: { unit: 'day', count: 15 },
  monthly: { unit: 'month', count: 1 }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function presetFor(unit: RecurrenceIntervalUnit, count: number): Preset {
  const entry = (Object.entries(PRESET_INTERVALS) as [Exclude<Preset, 'custom'>, { unit: RecurrenceIntervalUnit; count: number }][]).find(([, v]) => v.unit === unit && v.count === count)
  return entry?.[0] ?? 'custom'
}

function buildModel(rule: RecurringTransaction | null, defaultAccountId: string): RecurringFormModel {
  if (!rule) {
    return {
      type: 'expense',
      accountId: defaultAccountId,
      categoryId: '',
      amount: null,
      description: '',
      preset: 'monthly',
      intervalUnit: 'month',
      intervalCount: 1,
      startDate: todayIso(),
      endDate: ''
    }
  }

  return {
    type: rule.type,
    accountId: rule.accountId,
    categoryId: rule.categoryId ?? '',
    amount: rule.amount,
    description: rule.description ?? '',
    preset: presetFor(rule.intervalUnit, rule.intervalCount),
    intervalUnit: rule.intervalUnit,
    intervalCount: rule.intervalCount,
    startDate: rule.startDate,
    endDate: rule.endDate ?? ''
  }
}

@Component({
  selector: 'app-recurring-form',
  imports: [FormField, DecimalPipe, Modal],
  template: `
    <app-modal
      [title]="pendingOccurrences() ? '¿Agregamos lo que ya deberías tener registrado?' : rule() ? 'Editar' : 'Se repite automáticamente'"
      [eyebrow]="pendingOccurrences() ? 'Movimientos pendientes' : rule() ? 'Editar recurrente' : 'Nuevo movimiento recurrente'"
      (closed)="handleBackdropClick()">
      @if (pendingOccurrences(); as occurrences) {
        <p class="text-muted text-sm">Desde la primera fecha hasta hoy, esta regla ya generaría {{ occurrences.length === 1 ? 'este movimiento' : 'estos movimientos' }}. Elige cuáles quieres agregar a Movimientos.</p>

        <div class="mt-6 flex flex-col gap-2">
          @for (occurrence of occurrences; track occurrence.date) {
            <label class="border-border flex items-center gap-3 rounded-xl border px-4 py-3.5">
              <input
                type="checkbox"
                [checked]="occurrence.selected"
                (change)="toggleOccurrence(occurrence.date)"
                class="accent-primary h-4 w-4" />
              <span class="text-ink text-sm font-medium">{{ occurrence.date }}</span>
              <span
                class="ml-auto text-sm font-semibold"
                [class]="model().type === 'income' ? 'text-positive' : 'text-negative'">
                {{ model().type === 'income' ? '+' : '−' }}{{ model().amount | number: '1.0-0' }} {{ selectedAccountCurrency() }}
              </span>
            </label>
          }
        </div>

        @if (errorMessage()) {
          <p class="bg-negative-soft text-negative mt-4 rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
        }
      } @else {
        <form
          id="recurringForm"
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
            <span class="text-muted text-sm font-medium">Cuenta</span>
            <select
              [formField]="recurringForm.accountId"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              <option value="">Selecciona una cuenta</option>
              @for (account of accountsService.accounts(); track account.id) {
                <option [value]="account.id">{{ account.name }}</option>
              }
            </select>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Categoría</span>
            <select
              [formField]="recurringForm.categoryId"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              <option value="">Selecciona una categoría</option>
              @for (category of categoriesForType(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Monto</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              [formField]="recurringForm.amount"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            @if (recurringForm.amount().touched() && recurringForm.amount().invalid()) {
              <span class="text-negative text-sm">Ingresa un monto mayor a cero.</span>
            }
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Descripción (opcional)</span>
            <input
              type="text"
              placeholder="Salario, arriendo…"
              [formField]="recurringForm.description"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          </label>

          <div class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Frecuencia</span>
            <div class="grid grid-cols-2 gap-2">
              @for (option of presetOptions; track option.value) {
                <button
                  type="button"
                  (click)="setPreset(option.value)"
                  [class]="
                    model().preset === option.value
                      ? 'bg-primary rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200'
                      : 'border-border text-ink hover:border-ink rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors duration-200'
                  ">
                  {{ option.label }}
                </button>
              }
            </div>
          </div>

          @if (model().preset === 'custom') {
            <div class="flex items-end gap-3">
              <label class="flex flex-col gap-2">
                <span class="text-muted text-sm font-medium">Cada</span>
                <input
                  type="number"
                  [formField]="recurringForm.intervalCount"
                  class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-24 rounded-xl border px-4 py-3.5 text-base outline-none" />
              </label>
              <label class="flex flex-1 flex-col gap-2">
                <span class="text-muted text-sm font-medium">&nbsp;</span>
                <select
                  [formField]="recurringForm.intervalUnit"
                  class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
                  <option value="day">Días</option>
                  <option value="week">Semanas</option>
                  <option value="month">Meses</option>
                </select>
              </label>
            </div>
          }

          <div class="flex gap-4">
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Primera vez</span>
              <input
                type="date"
                [formField]="recurringForm.startDate"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            </label>
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Hasta (opcional)</span>
              <input
                type="date"
                [formField]="recurringForm.endDate"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            </label>
          </div>

          @if (errorMessage()) {
            <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
          }
        </form>
      }

      <button
        ngProjectAs="[modal-footer]"
        [hidden]="!pendingOccurrences()"
        type="button"
        [disabled]="isProcessingOccurrences()"
        (click)="skipOccurrences()"
        class="border-ink text-ink hover:bg-ink flex-1 rounded-full border px-6 py-3.5 text-base font-semibold transition-colors duration-300 hover:text-white disabled:opacity-60">
        Omitir
      </button>
      <button
        ngProjectAs="[modal-footer]"
        [hidden]="!pendingOccurrences()"
        type="button"
        [disabled]="isProcessingOccurrences()"
        (click)="confirmOccurrences()"
        class="bg-primary hover:bg-primary-dark flex-1 rounded-full px-6 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
        {{ isProcessingOccurrences() ? 'Agregando…' : 'Agregar seleccionados' }}
      </button>
      <button
        ngProjectAs="[modal-footer]"
        [hidden]="pendingOccurrences()"
        type="button"
        (click)="cancelled.emit()"
        class="border-ink text-ink hover:bg-ink flex-1 rounded-full border px-6 py-3.5 text-base font-semibold transition-colors duration-300 hover:text-white">
        Cancelar
      </button>
      <button
        ngProjectAs="[modal-footer]"
        [hidden]="pendingOccurrences()"
        type="submit"
        form="recurringForm"
        [disabled]="isSubmitting()"
        class="bg-primary hover:bg-primary-dark flex-1 rounded-full px-6 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
        {{ isSubmitting() ? 'Guardando…' : 'Guardar' }}
      </button>
    </app-modal>
  `
})
export class RecurringForm {
  private readonly recurringService = inject(RecurringTransactionsService)
  private readonly transactionsService = inject(TransactionsService)
  protected readonly accountsService = inject(AccountsService)
  protected readonly categoriesService = inject(CategoriesService)

  readonly rule = input<RecurringTransaction | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  protected readonly typeOptions: { value: RecurringTransactionType; label: string }[] = [
    { value: 'expense', label: 'Gasto' },
    { value: 'income', label: 'Ingreso' }
  ]

  protected readonly presetOptions: { value: Preset; label: string }[] = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Cada 15 días' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'custom', label: 'Personalizada' }
  ]

  protected readonly model = linkedSignal<RecurringFormModel>(() => buildModel(this.rule(), untracked(() => this.accountsService.accounts())[0]?.id ?? ''))
  protected readonly recurringForm = form(this.model, path => {
    required(path.accountId, { message: 'Selecciona una cuenta' })
    required(path.categoryId, { message: 'Selecciona una categoría' })
    required(path.amount, { message: 'El monto es obligatorio' })
    min(path.amount, 0.01, { message: 'El monto debe ser mayor a cero' })
    required(path.startDate, { message: 'La fecha es obligatoria' })
    min(path.intervalCount, 1, { message: 'Debe ser al menos 1' })
  })

  protected readonly categoriesForType = computed(() => this.categoriesService.categories().filter(category => category.type === this.model().type))

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected readonly pendingOccurrences = signal<PendingOccurrence[] | null>(null)
  protected readonly isProcessingOccurrences = signal(false)
  private catchUpRuleId: string | null = null
  private catchUpNextRunDate: string | null = null
  private catchUpIsActive = true

  protected readonly selectedAccountCurrency = computed(() => this.accountsService.accounts().find(a => a.id === this.model().accountId)?.currency ?? 'COP')

  protected setType(type: RecurringTransactionType): void {
    this.model.update(current => ({ ...current, type, categoryId: '' }))
  }

  protected setPreset(preset: Preset): void {
    this.model.update(current => {
      if (preset === 'custom') return { ...current, preset }
      const interval = PRESET_INTERVALS[preset]
      return { ...current, preset, intervalUnit: interval.unit, intervalCount: interval.count }
    })
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.recurringForm, async () => {
      const current = this.model()
      const account = this.accountsService.accounts().find(a => a.id === current.accountId)

      const input: RecurringTransactionInput = {
        accountId: current.accountId,
        categoryId: current.categoryId,
        type: current.type,
        amount: current.amount as number,
        currency: account?.currency ?? 'COP',
        description: current.description,
        intervalUnit: current.intervalUnit,
        intervalCount: current.intervalCount,
        startDate: current.startDate,
        endDate: current.endDate
      }

      this.isSubmitting.set(true)
      try {
        const existing = this.rule()
        if (existing) {
          await this.recurringService.update(existing.id, input)
          this.saved.emit()
          return
        }

        const created = await this.recurringService.create(input)
        const catchUp = computeCatchUp(created.startDate, created.intervalUnit, created.intervalCount, created.endDate, todayIso())

        if (catchUp.pendingDates.length === 0) {
          this.saved.emit()
          return
        }

        this.catchUpRuleId = created.id
        this.catchUpNextRunDate = catchUp.nextRunDate
        this.catchUpIsActive = catchUp.isActive
        this.pendingOccurrences.set(catchUp.pendingDates.map(date => ({ date, selected: true })))
      } catch {
        this.errorMessage.set('No se pudo guardar. Intenta de nuevo.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }

  protected toggleOccurrence(date: string): void {
    this.pendingOccurrences.update(list => list?.map(occurrence => (occurrence.date === date ? { ...occurrence, selected: !occurrence.selected } : occurrence)) ?? null)
  }

  protected handleBackdropClick(): void {
    if (this.pendingOccurrences()) {
      this.skipOccurrences()
      return
    }
    this.cancelled.emit()
  }

  protected async confirmOccurrences(): Promise<void> {
    const ruleId = this.catchUpRuleId
    const nextRunDate = this.catchUpNextRunDate
    const occurrences = this.pendingOccurrences()
    if (!ruleId || !nextRunDate || !occurrences) return

    this.isProcessingOccurrences.set(true)
    try {
      const current = this.model()
      const account = this.accountsService.accounts().find(a => a.id === current.accountId)

      for (const occurrence of occurrences.filter(o => o.selected)) {
        await this.transactionsService.create({
          accountId: current.accountId,
          categoryId: current.categoryId,
          type: current.type,
          amount: current.amount as number,
          currency: account?.currency ?? 'COP',
          description: current.description,
          occurredAt: occurrence.date,
          transferAccountId: null,
          cardStatementId: null
        })
      }

      await this.recurringService.catchUp(ruleId, nextRunDate, this.catchUpIsActive)
      this.saved.emit()
    } catch {
      this.errorMessage.set('No se pudieron agregar los movimientos. Intenta de nuevo.')
    } finally {
      this.isProcessingOccurrences.set(false)
    }
  }

  protected async skipOccurrences(): Promise<void> {
    const ruleId = this.catchUpRuleId
    const nextRunDate = this.catchUpNextRunDate
    if (!ruleId || !nextRunDate) return

    this.isProcessingOccurrences.set(true)
    try {
      await this.recurringService.catchUp(ruleId, nextRunDate, this.catchUpIsActive)
      this.saved.emit()
    } catch {
      this.errorMessage.set('No se pudo continuar. Intenta de nuevo.')
    } finally {
      this.isProcessingOccurrences.set(false)
    }
  }
}
