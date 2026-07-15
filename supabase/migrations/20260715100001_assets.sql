-- Patrimonio: manually-tracked net worth items that live outside the account/transaction system
-- (real estate, vehicles, valuables). Unlike accounts, there's no ledger of movements here — the
-- user just updates current_value by hand whenever it changes, so last_updated_at records when
-- that happened (not a created_at/updated_at audit trail).

create type public.asset_category as enum ('real_estate', 'vehicle', 'electronics', 'valuable', 'other');

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category public.asset_category not null,
  current_value numeric(14, 2) not null check (current_value >= 0),
  currency text not null,
  last_updated_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_user_id_idx on public.assets (user_id);

create trigger set_assets_updated_at
  before update on public.assets
  for each row
  execute function public.set_updated_at();

alter table public.assets enable row level security;

create policy "assets_all_own"
  on public.assets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
