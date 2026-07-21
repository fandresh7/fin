import { Component, input, output } from '@angular/core'
import { CdkTrapFocus } from '@angular/cdk/a11y'

let nextId = 0

@Component({
  selector: 'app-modal',
  imports: [CdkTrapFocus],
  host: {
    class: 'bg-ink/40 fixed inset-0 z-50 flex items-center justify-center px-4 py-8',
    '(click)': 'closed.emit()'
  },
  template: `
    <div
      cdkTrapFocus
      cdkTrapFocusAutoCapture
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      class="shadow-elevated border-border bg-surface flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-[22px] border"
      [class.max-w-sm]="panelWidth() === 'sm'"
      [class.max-w-md]="panelWidth() === 'md'"
      (click)="$event.stopPropagation()"
      (keydown.escape)="closed.emit()">
      <header class="border-border flex shrink-0 items-start justify-between gap-4 border-b px-7 py-6">
        <div class="flex flex-col gap-1">
          @if (eyebrow()) {
            <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">{{ eyebrow() }}</span>
          }
          <h2
            [id]="titleId"
            class="text-ink text-xl font-bold">
            {{ title() }}
          </h2>
        </div>
        <button
          type="button"
          (click)="closed.emit()"
          aria-label="Cerrar"
          class="text-muted hover:text-ink hover:bg-paper -m-2 shrink-0 rounded-full p-2 text-xl leading-none transition-colors duration-200">
          ×
        </button>
      </header>
      <div class="flex-1 overflow-y-auto px-7 py-6">
        <ng-content />
      </div>
      <footer class="border-border flex shrink-0 justify-end gap-3 border-t px-7 py-6">
        <ng-content select="[modal-footer]" />
      </footer>
    </div>
  `
})
export class Modal {
  protected readonly titleId = `modal-title-${nextId++}`

  readonly title = input.required<string>()
  readonly eyebrow = input<string | null>(null)
  readonly panelWidth = input<'sm' | 'md'>('md')
  readonly closed = output<void>()
}
