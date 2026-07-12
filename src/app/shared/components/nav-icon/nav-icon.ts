import { Component, input } from '@angular/core'

export type NavIconName = 'home' | 'swap' | 'wallet' | 'card' | 'crypto' | 'budget' | 'tag' | 'user'

@Component({
  selector: 'app-nav-icon',
  host: { class: 'inline-flex' },
  template: `
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round">
      @switch (name()) {
        @case ('home') {
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
        }
        @case ('swap') {
          <path d="M4 8h13" />
          <path d="M14 4l3 4-3 4" />
          <path d="M20 16H7" />
          <path d="M10 12l-3 4 3 4" />
        }
        @case ('wallet') {
          <path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          <path d="M16 12h.01" />
        }
        @case ('card') {
          <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
          <path d="M3 10h18" />
        }
        @case ('crypto') {
          <path d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" />
          <path d="M9.5 10h3.25a1.25 1.25 0 1 1 0 2.5H9.5m0 0h3.75a1.25 1.25 0 1 1 0 2.5H9.5m0-5V9m0 6.5V16m2.5-6.5V9m0 6.5V16" />
        }
        @case ('budget') {
          <path d="M12 12V4a8 8 0 0 1 8 8h-8Z" />
          <path d="M12 12 5.6 15.9A8 8 0 1 1 12 4v8Z" />
        }
        @case ('tag') {
          <path d="M4 4h7l9 9-7 7-9-9V4Z" />
          <path d="M8 8h.01" />
        }
        @case ('user') {
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        }
      }
    </svg>
  `
})
export class NavIcon {
  readonly name = input.required<NavIconName>()
}
