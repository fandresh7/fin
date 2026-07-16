import { Component, computed, inject, signal } from '@angular/core'
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu'
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AuthService } from '../../core/auth/auth.service'
import { ProfilesService } from '../../core/profiles/profiles.service'
import { NavIcon, NavIconName } from '../../shared/components/nav-icon/nav-icon'

interface NavItem {
  label: string
  path: string
  icon: NavIconName
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NavIcon, CdkMenu, CdkMenuItem, CdkMenuTrigger],
  templateUrl: './dashboard-layout.html'
})
export class DashboardLayout {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly profilesService = inject(ProfilesService)

  protected readonly navItems: NavItem[] = [
    { label: 'Resumen', path: '/dashboard', icon: 'home' },
    { label: 'Movimientos', path: '/movimientos', icon: 'swap' },
    { label: 'Recurrentes', path: '/recurrentes', icon: 'repeat' },
    { label: 'Cuentas', path: '/cuentas', icon: 'wallet' },
    { label: 'Tarjetas', path: '/tarjetas', icon: 'card' },
    { label: 'Cripto', path: '/cripto', icon: 'crypto' },
    { label: 'Presupuestos', path: '/presupuestos', icon: 'budget' },
    { label: 'Categorías', path: '/categorias', icon: 'tag' },
    { label: 'Patrimonio', path: '/patrimonio', icon: 'gem' }
  ]

  protected readonly isSidebarOpen = signal(false)
  protected readonly userEmail = computed(() => this.auth.user()?.email ?? '')
  protected readonly userDisplayName = computed(() => this.profilesService.profile()?.displayName || this.userEmail())
  protected readonly userInitial = computed(() => this.userDisplayName().charAt(0).toUpperCase() || '?')

  constructor() {
    this.profilesService.load()
  }

  protected toggleSidebar(): void {
    this.isSidebarOpen.update(open => !open)
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false)
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut()
    await this.router.navigateByUrl('/login')
  }
}
