-- Crypto (Binance and similar) accounts hold multiple assets instead of a single currency
-- balance. crypto_transactions is the ledger; crypto_holdings is a cached per-asset quantity
-- kept in sync by the trigger below, so the app can read current holdings without summing
-- the whole ledger on every request. Fiat value is computed at query time from live prices,
-- not stored.

create type public.crypto_transaction_type as enum (
  'buy',
  'sell',
  'deposit',
  'withdraw',
  'swap_in',
  'swap_out'
);

create table public.crypto_holdings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  asset_symbol text not null,
  quantity numeric(28, 10) not null default 0,
  updated_at timestamptz not null default now(),

  unique (account_id, asset_symbol)
);

create index crypto_holdings_account_id_idx on public.crypto_holdings (account_id);

create table public.crypto_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  asset_symbol text not null,
  type public.crypto_transaction_type not null,
  quantity numeric(28, 10) not null check (quantity > 0),
  -- Price and fee are informational (cost basis / fee tracking); holdings math only needs quantity.
  price_per_unit numeric(18, 8),
  fiat_currency text,
  fee numeric(28, 10) not null default 0,
  notes text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index crypto_transactions_account_id_idx on public.crypto_transactions (account_id);
create index crypto_transactions_asset_symbol_idx on public.crypto_transactions (account_id, asset_symbol);

-- Both tables only make sense on crypto_exchange accounts.
create or replace function public.check_crypto_account_type()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.accounts
    where id = new.account_id and type = 'crypto_exchange'
  ) then
    raise exception '% must reference a crypto_exchange account', tg_table_name;
  end if;
  return new;
end;
$$;

create trigger crypto_holdings_account_type_check
  before insert or update of account_id on public.crypto_holdings
  for each row
  execute function public.check_crypto_account_type();

create trigger crypto_transactions_account_type_check
  before insert or update of account_id on public.crypto_transactions
  for each row
  execute function public.check_crypto_account_type();

-- Applies a crypto_transactions row to the cached crypto_holdings quantity.
-- buy/deposit/swap_in increase the asset; sell/withdraw/swap_out decrease it.
create or replace function public.apply_crypto_transaction()
returns trigger
language plpgsql
as $$
declare
  delta numeric(28, 10);
begin
  delta := case
    when new.type in ('buy', 'deposit', 'swap_in') then new.quantity
    else -new.quantity
  end;

  insert into public.crypto_holdings (account_id, asset_symbol, quantity)
  values (new.account_id, new.asset_symbol, delta)
  on conflict (account_id, asset_symbol)
  do update set quantity = crypto_holdings.quantity + excluded.quantity, updated_at = now();

  return new;
end;
$$;

create trigger crypto_transactions_apply
  after insert on public.crypto_transactions
  for each row
  execute function public.apply_crypto_transaction();

alter table public.crypto_holdings enable row level security;
alter table public.crypto_transactions enable row level security;

create policy "crypto_holdings_all_own"
  on public.crypto_holdings for all
  using (
    exists (
      select 1 from public.accounts
      where accounts.id = crypto_holdings.account_id
      and accounts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.accounts
      where accounts.id = crypto_holdings.account_id
      and accounts.user_id = auth.uid()
    )
  );

create policy "crypto_transactions_all_own"
  on public.crypto_transactions for all
  using (
    exists (
      select 1 from public.accounts
      where accounts.id = crypto_transactions.account_id
      and accounts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.accounts
      where accounts.id = crypto_transactions.account_id
      and accounts.user_id = auth.uid()
    )
  );
