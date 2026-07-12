import { Service, computed, inject, signal } from '@angular/core'
import { DOCUMENT } from '@angular/common'
import type { Session, User } from '@supabase/supabase-js'
import { SupabaseClientService } from '../supabase/supabase-client.service'

@Service()
export class AuthService {
  private readonly supabase = inject(SupabaseClientService).client
  private readonly document = inject(DOCUMENT)

  private readonly _session = signal<Session | null>(null)
  private readonly _isLoading = signal(true)

  readonly session = this._session.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly user = computed<User | null>(() => this._session()?.user ?? null)
  readonly isAuthenticated = computed(() => this._session() !== null)

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session.set(data.session)
      this._isLoading.set(false)
    })

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session)
      this._isLoading.set(false)
    })
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.document.location.origin}/reset-password`
    })
    if (error) throw error
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }
}
