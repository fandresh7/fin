-- Accounts are the "where the money lives": bank accounts, cash, credit cards, and crypto
-- exchange accounts. Crypto accounts don't hold a single currency balance — see crypto.sql
-- for how their value is tracked (crypto_holdings / crypto_transactions).

create type public.account_type as enum (
  'cash',
  'checking',
  'savings',
  'credit_card',
  'crypto_exchange',
  'investment',
  'other'
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type public.account_type not null,
  currency text,
  institution text,
  color text,
  icon text,
  -- Credit-card-only fields.
  credit_limit numeric(14, 2),
  cutoff_day smallint check (cutoff_day between 1 and 31),
  payment_due_day smallint check (payment_due_day between 1 and 31),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Every account type except crypto_exchange needs a single settlement currency;
  -- crypto_exchange accounts are multi-asset and must not set one.
  constraint accounts_currency_matches_type check (
    (type = 'crypto_exchange' and currency is null)
    or (type <> 'crypto_exchange' and currency is not null)
  ),

  -- credit_limit / cutoff_day / payment_due_day only make sense for credit cards.
  constraint accounts_credit_fields_match_type check (
    (type = 'credit_card')
    or (credit_limit is null and cutoff_day is null and payment_due_day is null)
  )
);

create index accounts_user_id_idx on public.accounts (user_id);

create trigger set_accounts_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "accounts_all_own"
  on public.accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
