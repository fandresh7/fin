-- Bootstraps a new signup: creates their profile row and a starter set of categories so the
-- app isn't empty on first login. Runs as security definer since it writes across a new user's
-- rows before any session/RLS context for that user exists.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
