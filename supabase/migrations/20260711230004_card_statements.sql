-- One row per credit-card billing cycle. `total_amount` / `paid_amount` are cached sums kept
-- current by the trigger in transactions.sql whenever a transaction is linked to a statement.

create type public.card_statement_status as enum ('open', 'closed', 'paid', 'overdue');

create table public.card_statements (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  due_date date not null check (due_date >= period_end),
  status public.card_statement_status not null default 'open',
  total_amount numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (account_id, period_start)
);

create index card_statements_account_id_idx on public.card_statements (account_id);

create trigger set_card_statements_updated_at
  before update on public.card_statements
  for each row
  execute function public.set_updated_at();

-- Statements only make sense on credit_card accounts.
create or replace function public.check_card_statement_account_type()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.accounts
    where id = new.account_id and type = 'credit_card'
  ) then
    raise exception 'card_statements.account_id must reference a credit_card account';
  end if;
  return new;
end;
$$;

create trigger card_statements_account_type_check
  before insert or update of account_id on public.card_statements
  for each row
  execute function public.check_card_statement_account_type();

alter table public.card_statements enable row level security;

create policy "card_statements_all_own"
  on public.card_statements for all
  using (
    exists (
      select 1 from public.accounts
      where accounts.id = card_statements.account_id
      and accounts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.accounts
      where accounts.id = card_statements.account_id
      and accounts.user_id = auth.uid()
    )
  );
