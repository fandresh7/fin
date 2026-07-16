import { Component, inject } from '@angular/core'
import { AuthService } from '../../core/auth/auth.service'
import { ProfilesService } from '../../core/profiles/profiles.service'

@Component({
  selector: 'app-dashboard-page',
  template: `
    <h1 class="text-ink text-[28px] font-bold">Hola, {{ profilesService.profile()?.displayName || auth.user()?.email }}</h1>
    <p class="text-muted mt-2 max-w-[60ch]">Tu cuenta está conectada a Supabase. Cuentas, movimientos y presupuestos se construyen a partir de aquí.</p>
  `
})
export class DashboardPage {
  protected readonly auth = inject(AuthService)
  protected readonly profilesService = inject(ProfilesService)

  constructor() {
    this.profilesService.load()
  }
}
