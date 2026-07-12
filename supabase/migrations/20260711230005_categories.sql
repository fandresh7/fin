-- User-defined income/expense categories. Supports one level of nesting (parent_id) for
-- grouping, e.g. "Transporte" > "Gasolina".

create type public.category_type as enum ('income', 'expense');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type public.category_type not null,
  parent_id uuid references public.categories (id) on delete set null,
  icon text,
  color text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),

  unique (user_id, name, type)
);

create index categories_user_id_idx on public.categories (user_id);
create index categories_parent_id_idx on public.categories (parent_id);

-- A subcategory must share its parent's type (an expense category can't nest under income).
create or replace function public.check_category_parent_type()
returns trigger
language plpgsql
as $$
declare
  parent_type public.category_type;
begin
  if new.parent_id is null then
    return new;
  end if;

  select type into parent_type from public.categories where id = new.parent_id;

  if parent_type is null then
    raise exception 'categories.parent_id does not exist';
  end if;

  if parent_type <> new.type then
    raise exception 'a % category cannot be nested under a % category', new.type, parent_type;
  end if;

  return new;
end;
$$;

create trigger categories_parent_type_check
  before insert or update of parent_id, type on public.categories
  for each row
  execute function public.check_category_parent_type();

alter table public.categories enable row level security;

create policy "categories_all_own"
  on public.categories for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
