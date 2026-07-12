import { Component, inject } from '@angular/core'
import { AuthService } from '../../core/auth/auth.service'

@Component({
  selector: 'app-profile-page',
  template: `
    <div class="shadow-elevated border-border bg-surface max-w-xl rounded-[22px] border p-8 sm:p-11">
      <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">Perfil</span>
      <h1 class="text-ink mt-3 text-[28px] font-bold">{{ auth.user()?.email }}</h1>
      <p class="text-muted mt-2 text-sm">La edición de perfil (nombre, moneda por defecto) llega próximamente.</p>
    </div>
  `
})
export class ProfilePage {
  protected readonly auth = inject(AuthService)
}
