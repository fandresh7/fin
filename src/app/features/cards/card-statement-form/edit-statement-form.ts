import { Component, inject, input, output, signal } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { FormField, form, min, submit } from '@angular/forms/signals'
import { CardStatement, CardStatementStatus, CardStatementUpdateInput, CARD_STATEMENT_STATUS_LABELS } from '../../../core/card-statements/card-statement.model'
import { CardStatementsService } from '../../../core/card-statements/card-statements.service'

const STATUSES = Object.keys(CARD_STATEMENT_STATUS_LABELS) as CardStatementStatus[]

const EMPTY_STATEMENT: CardStatement = {
  id: '',
  accountId: '',
  periodStart: '',
  periodEnd: '',
  dueDate: '',
  status: 'open',
  totalAmount: 0,
  paidAmount: 0
}

@Component({
  selector: 'app-edit-statement-form',
  imports: [FormField, DecimalPipe],
  template: `
    <div
      class="bg-ink/40 fixed inset-0 z-50 flex items-center justify-center px-4"
      (click)="cancelled.emit()">
      <div
        class="shadow-elevated border-border bg-surface w-full max-w-sm rounded-[22px] border p-7"
        (click)="$event.stopPropagation()">
        <h2 class="text-ink text-lg font-bold">Editar ciclo</h2>
        <p class="text-muted mt-1 text-sm">{{ statement().periodStart }} → {{ statement().periodEnd }}</p>
        <p class="text-ink mt-3 text-2xl font-bold">{{ statement().totalAmount | number: '1.0-0' }}</p>
        <p class="text-muted text-sm">Total facturado</p>

        <form
          class="mt-6 flex flex-col gap-5"
          novalidate
          (submit)="handleSubmit($event)">
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Estado</span>
            <select
              [formField]="statementForm.status"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
              @for (status of statuses; track status) {
                <option [value]="status">{{ statusLabels[status] }}</option>
              }
            </select>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Monto pagado</span>
            <input
              type="number"
              step="1000"
              [formField]="statementForm.paidAmount"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
            @if (statementForm.paidAmount().touched() && statementForm.paidAmount().invalid()) {
              <span class="text-negative text-sm">El monto pagado no puede ser negativo.</span>
            }
          </label>

          @if (errorMessage()) {
            <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
          }

          <div class="mt-2 flex justify-end gap-3">
            <button
              type="button"
              (click)="cancelled.emit()"
              class="border-ink text-ink hover:bg-ink rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:text-white">
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="bg-primary hover:bg-primary-dark rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 disabled:opacity-60">
              {{ isSubmitting() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class EditStatementForm {
  private readonly cardStatementsService = inject(CardStatementsService)

  readonly statement = input<CardStatement>(EMPTY_STATEMENT)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  protected readonly statuses = STATUSES
  protected readonly statusLabels = CARD_STATEMENT_STATUS_LABELS

  protected readonly model = signal<CardStatementUpdateInput>({ status: this.statement().status, paidAmount: this.statement().paidAmount })
  protected readonly statementForm = form(this.model, path => {
    min(path.paidAmount, 0, { message: 'El monto pagado no puede ser negativo' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.statementForm, async () => {
      this.isSubmitting.set(true)
      try {
        await this.cardStatementsService.update(this.statement().id, this.model())
        this.saved.emit()
      } catch {
        this.errorMessage.set('No se pudo guardar. Intenta de nuevo.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
