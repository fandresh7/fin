import { Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { FormField, form, submit } from '@angular/forms/signals'
import { AuthService } from '../../core/auth/auth.service'
import { Profile, ProfileInput } from '../../core/profiles/profile.model'
import { ProfilesService } from '../../core/profiles/profiles.service'

const CURRENCIES = ['COP', 'USD', 'USDT']

function buildModel(profile: Profile | null): ProfileInput {
  return { displayName: profile?.displayName ?? '', defaultCurrency: profile?.defaultCurrency ?? 'COP' }
}

@Component({
  selector: 'app-profile-page',
  imports: [FormField],
  template: `
    <div class="shadow-elevated border-border bg-surface max-w-xl rounded-[22px] border p-8 sm:p-11">
      <span class="text-primary text-[13px] font-semibold tracking-[0.22em] uppercase">Perfil</span>
      <h1 class="text-ink mt-3 text-[28px] font-bold">{{ displayName() }}</h1>
      <p class="text-muted mt-2 text-sm">{{ auth.user()?.email }}</p>

      <form
        class="mt-8 flex flex-col gap-5"
        novalidate
        (submit)="handleSubmit($event)">
        <label class="flex flex-col gap-2">
          <span class="text-muted text-sm font-medium">Nombre</span>
          <input
            type="text"
            placeholder="¿Cómo te llamas?"
            [formField]="profileForm.displayName"
            class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none" />
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-muted text-sm font-medium">Moneda por defecto</span>
          <select
            [formField]="profileForm.defaultCurrency"
            class="border-border bg-paper text-ink focus:border-primary focus:bg-surface w-full rounded-xl border px-4 py-3.5 text-base outline-none">
            @for (currency of currencies; track currency) {
              <option [value]="currency">{{ currency }}</option>
            }
          </select>
        </label>

        @if (successMessage()) {
          <p class="bg-positive-soft text-positive rounded-lg px-3.5 py-2.5 text-sm">{{ successMessage() }}</p>
        }
        @if (errorMessage()) {
          <p class="bg-negative-soft text-negative rounded-lg px-3.5 py-2.5 text-sm">{{ errorMessage() }}</p>
        }

        <button
          type="submit"
          [disabled]="isSubmitting()"
          class="bg-primary hover:bg-primary-dark mt-1 self-start rounded-full px-7 py-3.5 text-base font-semibold text-white transition-colors duration-300 disabled:opacity-60">
          {{ isSubmitting() ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>
    </div>
  `
})
export class ProfilePage {
  protected readonly auth = inject(AuthService)
  protected readonly profilesService = inject(ProfilesService)

  protected readonly currencies = CURRENCIES

  // user_metadata comes with the session (no extra request), so it renders on the first paint
  // instead of flashing the email while profilesService's own table fetch is still in flight.
  protected readonly displayName = computed(() => (this.auth.user()?.user_metadata?.['full_name'] as string | undefined) || this.profilesService.profile()?.displayName || this.auth.user()?.email)

  protected readonly model = linkedSignal<ProfileInput>(() => buildModel(this.profilesService.profile()))
  protected readonly profileForm = form(this.model)

  protected readonly errorMessage = signal<string | null>(null)
  protected readonly successMessage = signal<string | null>(null)
  protected readonly isSubmitting = signal(false)

  constructor() {
    this.profilesService.load()
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault()
    this.errorMessage.set(null)
    this.successMessage.set(null)

    submit(this.profileForm, async () => {
      this.isSubmitting.set(true)
      try {
        await this.profilesService.update(this.model())
        this.successMessage.set('Perfil actualizado.')
      } catch {
        this.errorMessage.set('No se pudo guardar. Intenta de nuevo.')
      } finally {
        this.isSubmitting.set(false)
      }
    })
  }
}
