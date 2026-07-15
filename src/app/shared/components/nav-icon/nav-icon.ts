import { Component, input } from '@angular/core'

export type NavIconName = 'home' | 'swap' | 'wallet' | 'card' | 'crypto' | 'budget' | 'tag' | 'user' | 'repeat' | 'car' | 'device' | 'gem'

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
        @case ('repeat') {
          <path d="M4 12a8 8 0 0 1 13.6-5.66M20 12a8 8 0 0 1-13.6 5.66" />
          <path d="M17.6 6.34V3m0 3.34H21M6.4 17.66V21m0-3.34H3" />
        }
        @case ('car') {
          <path d="M4 16l1.2-4.8A2 2 0 0 1 7.1 9.7h9.8a2 2 0 0 1 1.9 1.5L20 16" />
          <path d="M3 16h18v3a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-9v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3Z" />
          <path d="M7 16h.01M17 16h.01" />
        }
        @case ('device') {
          <path d="M4 5h16v10H4Z" />
          <path d="M2 19h20l-2-3H4Z" />
        }
        @case ('gem') {
          <path d="M12 2 3 9l9 13 9-13Z" />
          <path d="M3 9h18M8 9 12 2l4 7" />
        }
      }
    </svg>
  `
})
export class NavIcon {
  readonly name = input.required<NavIconName>()
}
