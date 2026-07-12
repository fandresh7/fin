import { Component, inject, signal } from '@angular/core'
import { email, form, FormField, required, submit } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import { AuthService } from '../../../core/auth/auth.service'

interface ForgotPasswordModel {
  email: string
}

@Component({
  selector: 'app-forgot-password-page',
  imports: [FormField, RouterLink],
  template: `
    <div class="bg-paper flex min-h-screen items-center justify-center px-6 py-12">
      <div class="shadow-elevated border-border bg-surface w-full max-w-md rounded-[22px] border p-8 sm:p-11">
        <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">fin</span>
        <h1 class="text-ink mt-3 text-[28px] leading-tight font-bold">Recupera tu contraseña</h1>
        <p class="text-muted mt-2 text-sm">Te enviaremos un enlace a tu correo para elegir una nueva contraseña.</p>

        @if (successMessage()) {
          <p class="bg-positive-soft text-positive mt-8 rounded-lg px-3.5 py-2.5 text-sm">{{ successMessage() }}</p>
        } @else {
          <form
            class="mt-8 flex flex-col gap-5"
            novalidate
            (submit)="handleSubmit($event)">
            <label class="flex flex-col gap-2">
              <span class="text-muted text-sm font-medium">Correo</span>
              <input
                type="email"
                autocomplete="email"
                [formField]="requestForm.email"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 font-sans text-base outline-none" />
              @if (requestForm.email().touched() && requestForm.email().invalid()) {
                <span class="text-negative text-sm">Ingresa un correo válido.</span>
              }
            </label>

            @if (errorMessage()) {
              <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
            }

            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="bg-primary hover:bg-primary-dark mt-1 rounded-full px-7 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
              {{ isSubmitting() ? 'Enviando…' : 'Enviar enlace' }}
            </button>
          </form>
        }

        <a
          routerLink="/login"
          class="text-primary hover:text-primary-dark mt-6 inline-block text-sm font-medium">
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  `
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService)

  protected readonly model = signal<ForgotPasswordModel>({ email: '' })
  protected readonly requestForm = form(this.model, path => {
    required(path.email, { message: 'El correo es obligatorio' })
    email(path.email, { message: 'Ingresa un correo válido' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly successMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.requestForm, async () => {
      this.isSubmitting.set(true)
      try {
        await this.auth.requestPasswordReset(this.model().email)
        this.successMessage.set('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.')
      } catch {
        this.errorMessage.set('No se pudo enviar el enlace. Intenta de nuevo.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
