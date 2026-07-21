import { Component, inject, input, linkedSignal, output, signal } from '@angular/core'
import { FormField, form, required, submit } from '@angular/forms/signals'
import { Modal } from '../../../shared/components/modal/modal'
import { CardStatementInput } from '../../../core/card-statements/card-statement.model'
import { CardStatementsService } from '../../../core/card-statements/card-statements.service'

function buildModel(accountId: string | null): CardStatementInput {
  return { accountId: accountId ?? '', periodStart: '', periodEnd: '', dueDate: '' }
}

@Component({
  selector: 'app-create-statement-form',
  imports: [FormField, Modal],
  template: `
    <app-modal
      title="Nuevo ciclo de facturación"
      panelWidth="sm"
      (closed)="cancelled.emit()">
      <form
        id="createStatementForm"
        class="flex flex-col gap-5"
        novalidate
        (submit)="handleSubmit($event)">
        <div class="flex gap-4">
          <label class="flex flex-1 flex-col gap-2">
            <span class="text-muted text-sm font-medium">Corte anterior</span>
            <input
              type="date"
              [formField]="statementForm.periodStart"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          </label>
          <label class="flex flex-1 flex-col gap-2">
            <span class="text-muted text-sm font-medium">Corte actual</span>
            <input
              type="date"
              [formField]="statementForm.periodEnd"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
          </label>
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-muted text-sm font-medium">Fecha de pago</span>
          <input
            type="date"
            [formField]="statementForm.dueDate"
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
        class="border-ink text-ink hover:bg-ink rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:text-white">
        Cancelar
      </button>
      <button
        ngProjectAs="[modal-footer]"
        type="submit"
        form="createStatementForm"
        [disabled]="isSubmitting()"
        class="bg-primary hover:bg-primary-dark rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 disabled:opacity-60">
        {{ isSubmitting() ? 'Guardando…' : 'Guardar' }}
      </button>
    </app-modal>
  `
})
export class CreateStatementForm {
  private readonly cardStatementsService = inject(CardStatementsService)

  readonly accountId = input<string | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  protected readonly model = linkedSignal<CardStatementInput>(() => buildModel(this.accountId()))
  protected readonly statementForm = form(this.model, path => {
    required(path.periodStart, { message: 'La fecha de corte anterior es obligatoria' })
    required(path.periodEnd, { message: 'La fecha de corte actual es obligatoria' })
    required(path.dueDate, { message: 'La fecha de pago es obligatoria' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.statementForm, async () => {
      const current = this.model()

      if (current.periodEnd <= current.periodStart) {
        this.errorMessage.set('El corte actual debe ser posterior al corte anterior.')
        return
      }
      if (current.dueDate < current.periodEnd) {
        this.errorMessage.set('La fecha de pago debe ser igual o posterior al corte actual.')
        return
      }

      this.isSubmitting.set(true)
      try {
        await this.cardStatementsService.create(current)
        this.saved.emit()
      } catch {
        this.errorMessage.set('No se pudo guardar. Puede que ya exista un ciclo con esa fecha de corte.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
