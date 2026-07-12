-- Shared helpers used by every table below.

create extension if not exists pgcrypto with schema extensions;

-- Keeps `updated_at` current on every row update. Attached per-table further down.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
