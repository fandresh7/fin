import { Component, inject, signal } from '@angular/core'
import { form, FormField, minLength, required, submit } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import { AuthService } from '../../../core/auth/auth.service'

interface ResetPasswordModel {
  password: string
  confirmPassword: string
}

@Component({
  selector: 'app-reset-password-page',
  imports: [FormField, RouterLink],
  template: `
    <div class="bg-paper flex min-h-screen items-center justify-center px-6 py-12">
      <div class="shadow-elevated border-border bg-surface w-full max-w-md rounded-[22px] border p-8 sm:p-11">
        <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">fin</span>
        <h1 class="text-ink mt-3 text-[28px] leading-tight font-bold">Elige una nueva contraseña</h1>
        <p class="text-muted mt-2 text-sm">Debe tener al menos 8 caracteres.</p>

        @if (successMessage()) {
          <p class="bg-positive-soft text-positive mt-8 rounded-lg px-3.5 py-2.5 text-sm">{{ successMessage() }}</p>
          <a
            routerLink="/dashboard"
            class="text-primary hover:text-primary-dark mt-6 inline-block text-sm font-medium">
            Ir a mi cuenta
          </a>
        } @else {
          <form
            class="mt-8 flex flex-col gap-5"
            novalidate
            (submit)="handleSubmit($event)">
            <label class="flex flex-col gap-2">
              <span class="text-muted text-sm font-medium">Nueva contraseña</span>
              <input
                type="password"
                autocomplete="new-password"
                [formField]="resetForm.password"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 font-sans text-base outline-none" />
              @if (resetForm.password().touched() && resetForm.password().invalid()) {
                <span class="text-negative text-sm">Mínimo 8 caracteres.</span>
              }
            </label>

            <label class="flex flex-col gap-2">
              <span class="text-muted text-sm font-medium">Confirma la contraseña</span>
              <input
                type="password"
                autocomplete="new-password"
                [formField]="resetForm.confirmPassword"
                class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 font-sans text-base outline-none" />
            </label>

            @if (errorMessage()) {
              <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
            }

            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="bg-primary hover:bg-primary-dark mt-1 rounded-full px-7 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
              {{ isSubmitting() ? 'Guardando…' : 'Guardar contraseña' }}
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService)

  protected readonly model = signal<ResetPasswordModel>({ password: '', confirmPassword: '' })
  protected readonly resetForm = form(this.model, path => {
    required(path.password, { message: 'La contraseña es obligatoria' })
    minLength(path.password, 8, { message: 'Mínimo 8 caracteres' })
    required(path.confirmPassword, { message: 'Confirma la contraseña' })
  })

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly successMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)

    submit(this.resetForm, async () => {
      const { password, confirmPassword } = this.model()
      if (password !== confirmPassword) {
        this.errorMessage.set('Las contraseñas no coinciden.')
        return
      }

      this.isSubmitting.set(true)
      try {
        await this.auth.updatePassword(password)
        this.successMessage.set('Tu contraseña se actualizó correctamente.')
      } catch {
        this.errorMessage.set('No se pudo actualizar la contraseña. Vuelve a solicitar el enlace.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
