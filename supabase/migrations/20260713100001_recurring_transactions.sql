-- Recurring income/expense rules (salary every month, rent every 15 days, etc). A daily
-- pg_cron job finds rules whose next_run_date has arrived, inserts the real transaction, and
-- advances next_run_date by the rule's interval. No transfers here — recurring rules only cover
-- income/expense, matching how they're actually used (a fixed paycheck or a fixed bill).

create type public.recurrence_interval_unit as enum ('day', 'week', 'month');

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null,
  description text,
  interval_unit public.recurrence_interval_unit not null,
  interval_count smallint not null check (interval_count > 0),
  start_date date not null,
  next_run_date date not null,
  end_date date,
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint recurring_transactions_no_transfer check (type <> 'transfer'),
  constraint recurring_transactions_end_after_start check (end_date is null or end_date >= start_date)
);

create index recurring_transactions_user_id_idx on public.recurring_transactions (user_id);
create index recurring_transactions_next_run_idx on public.recurring_transactions (next_run_date) where is_active;

create trigger set_recurring_transactions_updated_at
  before update on public.recurring_transactions
  for each row
  execute function public.set_updated_at();

alter table public.recurring_transactions enable row level security;

create policy "recurring_transactions_all_own"
  on public.recurring_transactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Applies every due rule once: inserts the transaction, then advances next_run_date past today
-- (a loop, not a single addition, so a rule that was paused/missed for a while catches up to the
-- correct next date instead of remaining perpetually "due" and firing many times in one run).
create or replace function public.generate_recurring_transactions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_next date;
begin
  for r in
    select * from public.recurring_transactions
    where is_active
    and next_run_date <= current_date
    and (end_date is null or next_run_date <= end_date)
  loop
    insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at)
    values (r.user_id, r.account_id, r.category_id, r.type, r.amount, r.currency, r.description, r.next_run_date);

    v_next := r.next_run_date;
    while v_next <= current_date loop
      v_next := case r.interval_unit
        when 'day' then v_next + (r.interval_count || ' days')::interval
        when 'week' then v_next + (r.interval_count || ' weeks')::interval
        when 'month' then v_next + (r.interval_count || ' months')::interval
      end;
    end loop;

    update public.recurring_transactions
    set
      next_run_date = v_next,
      last_run_at = now(),
      is_active = case when r.end_date is not null and v_next > r.end_date then false else is_active end
    where id = r.id;
  end loop;
end;
$$;

-- pg_cron ships available on Supabase; this just needs the extension turned on once.
-- cron.schedule() upserts by job_name, so re-running this migration is safe.
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'generate-recurring-transactions',
  '10 5 * * *', -- 05:10 UTC = 00:10 Colombia time, safely after midnight local
  $$select public.generate_recurring_transactions();$$
);
