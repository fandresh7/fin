import { Component, computed, inject } from '@angular/core'
import { AuthService } from '../../core/auth/auth.service'

@Component({
  selector: 'app-dashboard-page',
  template: `
    <h1 class="text-ink text-[28px] font-bold">Hola, {{ displayName() }}</h1>
    <p class="text-muted mt-2 max-w-[60ch]">Tu cuenta está conectada a Supabase. Cuentas, movimientos y presupuestos se construyen a partir de aquí.</p>
  `
})
export class DashboardPage {
  protected readonly auth = inject(AuthService)

  protected readonly displayName = computed(() => this.auth.displayName() || this.auth.user()?.email)
}
