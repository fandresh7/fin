import { Component, input, output } from '@angular/core'

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div
      class="bg-ink/40 fixed inset-0 z-50 flex items-center justify-center px-4"
      (click)="cancelled.emit()">
      <div
        class="shadow-elevated border-border bg-surface w-full max-w-sm rounded-[22px] border p-7"
        (click)="$event.stopPropagation()">
        <h2 class="text-ink text-lg font-bold">{{ title() }}</h2>
        <p class="text-muted mt-2 text-sm">{{ message() }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="border-ink text-ink hover:bg-ink rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:text-white">
            Cancelar
          </button>
          <button
            type="button"
            (click)="confirmed.emit()"
            class="bg-negative rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialog {
  readonly title = input.required<string>()
  readonly message = input.required<string>()
  readonly confirmLabel = input('Eliminar')
  readonly confirmed = output<void>()
  readonly cancelled = output<void>()
}
