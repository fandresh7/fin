import { Component, inject, signal } from '@angular/core'
import { email, form, FormField, required, submit } from '@angular/forms/signals'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '../../../core/auth/auth.service'

interface LoginModel {
  email: string
  password: string
}

@Component({
  selector: 'app-login-page',
  imports: [FormField, RouterLink],
  template: `
    <div class="bg-paper flex min-h-screen items-center justify-center px-6 py-12">
      <div class="shadow-elevated border-border bg-surface w-full max-w-md rounded-[22px] border p-8 sm:p-11">
        <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">fin</span>
        <h1 class="text-ink mt-3 text-[28px] leading-tight font-bold">Ingresa a tu cuenta</h1>
        <p class="text-muted mt-2 text-sm">Controla tus ingresos, gastos y presupuestos en un solo lugar.</p>

        <form
          class="mt-8 flex flex-col gap-5"
          novalidate
          (submit)="handleSubmit($event)">
          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Correo</span>
            <input
              type="email"
              autocomplete="email"
              [formField]="loginForm.email"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 font-sans text-base outline-none" />
            @if (loginForm.email().touched() && loginForm.email().invalid()) {
              <span class="text-negative text-sm">Ingresa un correo válido.</span>
            }
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-muted text-sm font-medium">Contraseña</span>
            <input
              type="password"
              autocomplete="current-password"
              [formField]="loginForm.password"
              class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 font-sans text-base outline-none" />
            @if (loginForm.password().touched() && loginForm.password().invalid()) {
              <span class="text-negative text-sm">La contraseña es obligatoria.</span>
            }
          </label>

          @if (errorMessage()) {
            <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
          }

          <button
            type="submit"
            [disabled]="isSubmitting()"
            class="bg-primary hover:bg-primary-dark mt-1 rounded-full px-7 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
            {{ isSubmitting() ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>

        <div class="mt-6 text-sm">
          <a
            routerLink="/forgot-password"
            class="text-primary hover:text-primary-dark font-medium">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </div>
  `
})
export class LoginPage {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  protected readonly model = signal<LoginModel>({ email: '', password: '' })
  protected readonly loginForm = form(this.model, path => {
    required(path.email, { message: 'El correo es obligatorio' })
    email(path.email, { message: 'Ingresa un correo válido' })
    required(path.password, { message: 'La contraseña es obligatoria' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.loginForm, async () => {
      this.isSubmitting.set(true)
      try {
        await this.auth.signIn(this.model().email, this.model().password)
        await this.router.navigateByUrl('/dashboard')
      } catch {
        this.errorMessage.set('Correo o contraseña incorrectos.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
