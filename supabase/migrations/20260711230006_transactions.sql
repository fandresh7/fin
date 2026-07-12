-- The core ledger: every income, expense, and transfer between accounts.
-- Crypto buy/sell/deposit/withdraw activity lives in crypto_transactions instead (crypto.sql).

create type public.transaction_type as enum ('income', 'expense', 'transfer');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null,
  description text,
  occurred_at date not null default current_date,
  -- Destination account for transfers (e.g. paying a credit card from a checking account).
  transfer_account_id uuid references public.accounts (id) on delete set null,
  -- Links a credit-card purchase to the billing cycle it falls into.
  card_statement_id uuid references public.card_statements (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transactions_transfer_shape check (
    (type = 'transfer' and transfer_account_id is not null and transfer_account_id <> account_id)
    or (type <> 'transfer' and transfer_account_id is null)
  ),
  constraint transactions_transfer_has_no_category check (
    type <> 'transfer' or category_id is null
  )
);

create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_card_statement_id_idx on public.transactions (card_statement_id);
create index transactions_occurred_at_idx on public.transactions (occurred_at desc);

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- card_statement_id may only be set on transactions that belong to a credit_card account.
create or replace function public.check_transaction_statement_account()
returns trigger
language plpgsql
as $$
begin
  if new.card_statement_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.card_statements
    join public.accounts on accounts.id = card_statements.account_id
    where card_statements.id = new.card_statement_id
    and card_statements.account_id = new.account_id
    and accounts.type = 'credit_card'
  ) then
    raise exception 'transactions.card_statement_id must belong to the same credit_card account';
  end if;

  return new;
end;
$$;

create trigger transactions_statement_account_check
  before insert or update of card_statement_id, account_id on public.transactions
  for each row
  execute function public.check_transaction_statement_account();

-- Keeps card_statements.total_amount as the live sum of linked purchase transactions.
-- paid_amount / status are updated by the app when a payment is recorded, not derived here.
create or replace function public.recalc_card_statement_total()
returns trigger
language plpgsql
as $$
declare
  target_ids uuid[];
begin
  if tg_op = 'DELETE' then
    target_ids := array[old.card_statement_id];
  elsif tg_op = 'INSERT' then
    target_ids := array[new.card_statement_id];
  else
    target_ids := array[old.card_statement_id, new.card_statement_id];
  end if;

  update public.card_statements
  set total_amount = (
    select coalesce(sum(amount), 0)
    from public.transactions
    where card_statement_id = card_statements.id
    and type = 'expense'
  )
  where id = any(target_ids);

  return null;
end;
$$;

create trigger transactions_recalc_statement_total
  after insert or delete or update of amount, type, card_statement_id
  on public.transactions
  for each row
  execute function public.recalc_card_statement_total();

alter table public.transactions enable row level security;

create policy "transactions_all_own"
  on public.transactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
