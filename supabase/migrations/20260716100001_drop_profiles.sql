-- profiles turned out to be unnecessary: display_name and default_currency are just two
-- preferences nobody joins against in SQL, so they live better as Supabase auth user_metadata —
-- already synced to the session with zero extra queries — than as a separate table with its own
-- RLS policies and updated_at trigger.

drop trigger if exists set_profiles_updated_at on public.profiles;
drop table if exists public.profiles;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, icon)
  values
    (new.id, 'Salario', 'income', 'briefcase'),
    (new.id, 'Freelance', 'income', 'laptop'),
    (new.id, 'Inversiones', 'income', 'trending-up'),
    (new.id, 'Otros ingresos', 'income', 'plus-circle'),
    (new.id, 'Vivienda', 'expense', 'home'),
    (new.id, 'Alimentación', 'expense', 'utensils'),
    (new.id, 'Transporte', 'expense', 'car'),
    (new.id, 'Salud', 'expense', 'heart'),
    (new.id, 'Entretenimiento', 'expense', 'film'),
    (new.id, 'Compras', 'expense', 'shopping-bag'),
    (new.id, 'Servicios', 'expense', 'zap'),
    (new.id, 'Educación', 'expense', 'book'),
    (new.id, 'Suscripciones', 'expense', 'repeat'),
    (new.id, 'Otros gastos', 'expense', 'more-horizontal');

  return new;
end;
$$;
