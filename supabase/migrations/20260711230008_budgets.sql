-- Budgets have arbitrary periods (not necessarily calendar months), so they cover both
-- recurring monthly limits and one-off goals (a trip, an event) against a category.

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'COP',
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index budgets_user_id_idx on public.budgets (user_id);
create index budgets_category_id_idx on public.budgets (category_id);
create index budgets_period_idx on public.budgets (period_start, period_end);

create trigger set_budgets_updated_at
  before update on public.budgets
  for each row
  execute function public.set_updated_at();

alter table public.budgets enable row level security;

create policy "budgets_all_own"
  on public.budgets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Actual spend per budget, computed on read from the transactions ledger rather than cached,
-- since it only needs to be accurate when viewed (no other table depends on it).
create view public.budget_progress
with (security_invoker = true) as
select
  b.id as budget_id,
  b.user_id,
  b.category_id,
  b.name,
  b.amount,
  b.currency,
  b.period_start,
  b.period_end,
  coalesce(sum(t.amount) filter (
    where t.type = 'expense'
    and t.currency = b.currency
    and t.occurred_at between b.period_start and b.period_end
  ), 0) as spent_amount
from public.budgets b
left join public.transactions t
  on t.category_id = b.category_id
  and t.user_id = b.user_id
group by b.id;
