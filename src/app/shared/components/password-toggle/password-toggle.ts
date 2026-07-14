import { Component, input, output } from '@angular/core'

@Component({
  selector: 'app-password-toggle',
  host: { class: 'inline-flex' },
  template: `
    <button
      type="button"
      (click)="toggled.emit()"
      [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      [attr.aria-pressed]="visible()"
      class="text-muted hover:text-ink inline-flex items-center justify-center p-1 transition-colors duration-200">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round">
        @if (visible()) {
          <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        } @else {
          <path d="M3 3l18 18" />
          <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c5.5 0 9 7 9 7a15.8 15.8 0 0 1-3.1 3.9M6.6 6.6C4.3 8.1 3 12 3 12a15.7 15.7 0 0 0 4.1 4.9A9.6 9.6 0 0 0 12 19c1 0 1.9-.14 2.8-.4" />
          <path d="M9.9 10a3 3 0 0 0 4.2 4.2" />
        }
      </svg>
    </button>
  `
})
export class PasswordToggle {
  readonly visible = input.required<boolean>()
  readonly toggled = output<void>()
}
