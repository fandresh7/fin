import { Component, input, output } from '@angular/core'
import { Modal } from '../modal/modal'

@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal],
  template: `
    <app-modal
      [title]="title()"
      panelWidth="sm"
      (closed)="cancelled.emit()">
      <p class="text-muted text-sm">{{ message() }}</p>
      <button
        ngProjectAs="[modal-footer]"
        type="button"
        (click)="cancelled.emit()"
        class="border-ink text-ink hover:bg-ink rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:text-white">
        Cancelar
      </button>
      <button
        ngProjectAs="[modal-footer]"
        type="button"
        (click)="confirmed.emit()"
        class="bg-negative rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90">
        {{ confirmLabel() }}
      </button>
    </app-modal>
  `
})
export class ConfirmDialog {
  readonly title = input.required<string>()
  readonly message = input.required<string>()
  readonly confirmLabel = input('Eliminar')
  readonly confirmed = output<void>()
  readonly cancelled = output<void>()
}
