import { Component, inject, input, output, signal } from '@angular/core'
import { FormField, form, min, required, submit } from '@angular/forms/signals'
import { CategoriesService } from '../../../core/categories/categories.service'
import { Budget, BudgetInput } from '../../../core/budgets/budget.model'
import { BudgetsService } from '../../../core/budgets/budgets.service'

function firstOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function lastOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
}

function buildModel(budget: Budget | null): BudgetInput {
  if (!budget) {
    return { categoryId: '', name: '', amount: 0, currency: 'COP', periodStart: firstOfMonth(), periodEnd: lastOfMonth() }
  }

  return {
    categoryId: budget.categoryId,
    name: budget.name ?? '',
    amount: budget.amount,
    currency: budget.currency,
    periodStart: budget.periodStart,
    periodEnd: budget.periodEnd
  }
}

@Component({
  selector: 'app-budget-form',
  imports: [FormField],
  template: `
    <div
      class="bg-ink/40 fixed inset-0 z-50 flex justify-end"
      (click)="cancelled.emit()">
      <div
        class="shadow-elevated bg-surface flex h-full w-full max-w-md flex-col overflow-y-auto p-8"
        (click)="$event.stopPropagation()">
        <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">{{ budget() ? 'Editar presupuesto' : 'Nuevo presupuesto' }}</span>
        <h1 class="text-ink mt-2 text-[26px] font-bold">{{ budget() ? 'Editar' : 'Agrega un presupuesto' }}</h1>

        <form
          class="mt-8 flex flex-1 flex-col gap-5"
          novalidate
          (submit)="handleSubmit($event)">
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Categoría</span>
            <select
              [formField]="budgetForm.categoryId"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              <option value="">Selecciona una categoría</option>
              @for (category of categoriesService.categories(); track category.id) {
                @if (category.type === 'expense') {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              }
            </select>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Nombre (opcional)</span>
            <input
              type="text"
              placeholder="Alimentación julio"
              [formField]="budgetForm.name"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Monto límite</span>
            <input
              type="number"
              step="1000"
              [formField]="budgetForm.amount"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            @if (budgetForm.amount().touched() && budgetForm.amount().invalid()) {
              <span class="text-negative text-sm">Ingresa un monto mayor a cero.</span>
            }
          </label>

          <div class="flex gap-4">
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Desde</span>
              <input
                type="date"
                [formField]="budgetForm.periodStart"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            </label>
            <label class="flex flex-1 flex-col gap-2">
              <span class="text-muted text-sm font-medium">Hasta</span>
              <input
                type="date"
                [formField]="budgetForm.periodEnd"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            </label>
          </div>

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
export class BudgetForm {
  private readonly budgetsService = inject(BudgetsService)
  protected readonly categoriesService = inject(CategoriesService)

  readonly budget = input<Budget | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  protected readonly model = signal<BudgetInput>(buildModel(this.budget()))
  protected readonly budgetForm = form(this.model, path => {
    required(path.categoryId, { message: 'Selecciona una categoría' })
    required(path.amount, { message: 'El monto es obligatorio' })
    min(path.amount, 1, { message: 'El monto debe ser mayor a cero' })
    required(path.periodStart, { message: 'La fecha de inicio es obligatoria' })
    required(path.periodEnd, { message: 'La fecha de fin es obligatoria' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.budgetForm, async () => {
      const current = this.model()

      if (current.periodEnd < current.periodStart) {
        this.errorMessage.set('La fecha de fin debe ser posterior a la de inicio.')
        return
      }

      this.isSubmitting.set(true)
      try {
        const existing = this.budget()
        if (existing) {
          await this.budgetsService.update(existing.id, current)
        } else {
          await this.budgetsService.create(current)
        }
        this.saved.emit()
      } catch {
        this.errorMessage.set('No se pudo guardar el presupuesto. Intenta de nuevo.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
