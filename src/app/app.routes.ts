import { Routes } from '@angular/router'
import { authGuard, guestGuard } from './core/auth/auth.guard'

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page/login-page').then(m => m.LoginPage)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/forgot-password-page/forgot-password-page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password-page/reset-password-page').then(m => m.ResetPasswordPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout').then(m => m.DashboardLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-page').then(m => m.DashboardPage)
      },
      {
        path: 'movimientos',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoon),
        data: { title: 'Movimientos' }
      },
      {
        path: 'cuentas',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoon),
        data: { title: 'Cuentas' }
      },
      {
        path: 'tarjetas',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoon),
        data: { title: 'Tarjetas' }
      },
      {
        path: 'cripto',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoon),
        data: { title: 'Cripto' }
      },
      {
        path: 'presupuestos',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoon),
        data: { title: 'Presupuestos' }
      },
      {
        path: 'categorias',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoon),
        data: { title: 'Categorías' }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile-page').then(m => m.ProfilePage)
      }
    ]
  },
  {
    path: 'design-system',
    loadComponent: () => import('./features/design-system/design-system-page').then(m => m.DesignSystemPage)
  },
  { path: '**', redirectTo: 'dashboard' }
]
