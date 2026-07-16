export interface Profile {
  displayName: string | null
  defaultCurrency: string
}

export interface ProfileInput {
  displayName: string
  defaultCurrency: string
}

export interface ProfileRow {
  id: string
  display_name: string | null
  default_currency: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}
