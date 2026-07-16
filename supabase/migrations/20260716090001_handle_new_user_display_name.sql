-- Public signup is disabled, so users are created by hand via the Supabase Dashboard
-- (Authentication > Users > Add user) or the Admin API. Both let you set "User Metadata" as
-- JSON — reading raw_user_meta_data->>'full_name' here means whoever creates the account can
-- set their display name at creation time instead of it staying null until they visit Perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

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
