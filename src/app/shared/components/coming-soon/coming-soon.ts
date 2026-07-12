import { Component, input } from '@angular/core'

@Component({
  selector: 'app-coming-soon',
  template: `
    <div class="border-border bg-surface flex flex-col items-center justify-center rounded-[22px] border border-dashed px-8 py-24 text-center">
      <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">Próximamente</span>
      <h1 class="text-ink mt-3 text-[28px] font-bold">{{ title() }}</h1>
      <p class="text-muted mt-2 max-w-[46ch]">Esta sección todavía no está construida. Vuelve pronto.</p>
    </div>
  `
})
export class ComingSoon {
  readonly title = input.required<string>()
}
