import { Component, computed, inject } from '@angular/core'
import { AuthService } from '../../core/auth/auth.service'
import { ProfilesService } from '../../core/profiles/profiles.service'

@Component({
  selector: 'app-dashboard-page',
  template: `
    <h1 class="text-ink text-[28px] font-bold">Hola, {{ displayName() }}</h1>
    <p class="text-muted mt-2 max-w-[60ch]">Tu cuenta está conectada a Supabase. Cuentas, movimientos y presupuestos se construyen a partir de aquí.</p>
  `
})
export class DashboardPage {
  protected readonly auth = inject(AuthService)
  protected readonly profilesService = inject(ProfilesService)

  // user_metadata comes with the session (no extra request), so it renders on the first paint
  // instead of flashing the email while profilesService's own table fetch is still in flight.
  protected readonly displayName = computed(() => (this.auth.user()?.user_metadata?.['full_name'] as string | undefined) || this.profilesService.profile()?.displayName || this.auth.user()?.email)

  constructor() {
    this.profilesService.load()
  }
}
