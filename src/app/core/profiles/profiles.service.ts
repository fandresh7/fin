import { Service, inject, signal } from '@angular/core'
import { AuthService } from '../auth/auth.service'
import { SupabaseClientService } from '../supabase/supabase-client.service'
import { Profile, ProfileInput, ProfileRow } from './profile.model'

function fromRow(row: ProfileRow): Profile {
  return { displayName: row.display_name, defaultCurrency: row.default_currency }
}

@Service()
export class ProfilesService {
  private readonly supabase = inject(SupabaseClientService).client
  private readonly auth = inject(AuthService)

  private readonly _profile = signal<Profile | null>(null)
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly profile = this._profile.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) return

    this._isLoading.set(true)
    this._error.set(null)

    const { data, error } = await this.supabase.from('profiles').select('*').eq('id', userId).single()

    if (error) {
      this._error.set('No se pudo cargar tu perfil.')
      this._isLoading.set(false)
      return
    }

    this._profile.set(fromRow(data as ProfileRow))
    this._isLoading.set(false)
  }

  async update(input: ProfileInput): Promise<void> {
    const userId = this.auth.user()?.id
    if (!userId) throw new Error('No hay sesión activa')

    const { data, error } = await this.supabase
      .from('profiles')
      .update({ display_name: input.displayName || null, default_currency: input.defaultCurrency })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error

    this._profile.set(fromRow(data as ProfileRow))
  }
}
