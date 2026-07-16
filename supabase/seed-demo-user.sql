-- Seeds heavy, realistic demo data for demo@demo.com so every feature (Cuentas, Movimientos,
-- Recurrentes, Tarjetas, Cripto, Presupuestos, Categorías, Patrimonio, Dashboard) has enough
-- content to review end to end.
--
-- HOW TO RUN
-- 1. Create the user first (public signup is disabled): Supabase Dashboard > Authentication >
--    Users > Add user > email demo@demo.com, set any password, "Auto Confirm User" on.
--    This fires handle_new_user(), which creates the profile-equivalent categories automatically.
-- 2. Paste this whole file into the Supabase SQL Editor and run it (or
--    `npx supabase db execute -f supabase/seed-demo-user.sql --linked`).
-- 3. Re-runnable: it deletes any previous demo data for this user first, so running it again
--    resets the demo account instead of duplicating rows.

do $$
declare
  v_user_id uuid;

  v_checking_id uuid;
  v_savings_id uuid;
  v_cash_id uuid;
  v_card_id uuid;
  v_binance_id uuid;
  v_usd_savings_id uuid;

  v_cat_salario uuid;
  v_cat_freelance uuid;
  v_cat_inversiones uuid;
  v_cat_otros_ing uuid;
  v_cat_vivienda uuid;
  v_cat_alimentacion uuid;
  v_cat_transporte uuid;
  v_cat_salud uuid;
  v_cat_entretenimiento uuid;
  v_cat_compras uuid;
  v_cat_servicios uuid;
  v_cat_educacion uuid;
  v_cat_suscripciones uuid;
  v_cat_otros_gas uuid;

  v_statement_prev_id uuid;
  v_statement_curr_id uuid;

  v_today date := current_date;
  v_i int;
begin
  select id into v_user_id from auth.users where email = 'demo@demo.com';
  if v_user_id is null then
    raise exception 'demo@demo.com does not exist yet — create it in Supabase Dashboard > Authentication > Users first';
  end if;

  -- ── Clean slate for this user ────────────────────────────────────────────────────────────
  delete from public.crypto_transactions where account_id in (select id from public.accounts where user_id = v_user_id);
  delete from public.crypto_holdings where account_id in (select id from public.accounts where user_id = v_user_id);
  delete from public.transactions where user_id = v_user_id;
  delete from public.card_statements where account_id in (select id from public.accounts where user_id = v_user_id);
  delete from public.recurring_transactions where user_id = v_user_id;
  delete from public.budgets where user_id = v_user_id;
  delete from public.assets where user_id = v_user_id;
  delete from public.accounts where user_id = v_user_id;

  -- ── Categories (created by handle_new_user on signup; look them up) ─────────────────────
  select id into v_cat_salario from public.categories where user_id = v_user_id and name = 'Salario';
  select id into v_cat_freelance from public.categories where user_id = v_user_id and name = 'Freelance';
  select id into v_cat_inversiones from public.categories where user_id = v_user_id and name = 'Inversiones';
  select id into v_cat_otros_ing from public.categories where user_id = v_user_id and name = 'Otros ingresos';
  select id into v_cat_vivienda from public.categories where user_id = v_user_id and name = 'Vivienda';
  select id into v_cat_alimentacion from public.categories where user_id = v_user_id and name = 'Alimentación';
  select id into v_cat_transporte from public.categories where user_id = v_user_id and name = 'Transporte';
  select id into v_cat_salud from public.categories where user_id = v_user_id and name = 'Salud';
  select id into v_cat_entretenimiento from public.categories where user_id = v_user_id and name = 'Entretenimiento';
  select id into v_cat_compras from public.categories where user_id = v_user_id and name = 'Compras';
  select id into v_cat_servicios from public.categories where user_id = v_user_id and name = 'Servicios';
  select id into v_cat_educacion from public.categories where user_id = v_user_id and name = 'Educación';
  select id into v_cat_suscripciones from public.categories where user_id = v_user_id and name = 'Suscripciones';
  select id into v_cat_otros_gas from public.categories where user_id = v_user_id and name = 'Otros gastos';

  if v_cat_salario is null then
    raise exception 'Default categories not found for demo@demo.com — handle_new_user() should have created them on signup';
  end if;

  -- ── Accounts ──────────────────────────────────────────────────────────────────────────────
  insert into public.accounts (user_id, name, type, currency, institution)
  values (v_user_id, 'Bancolombia', 'checking', 'COP', 'Bancolombia')
  returning id into v_checking_id;

  insert into public.accounts (user_id, name, type, currency, institution)
  values (v_user_id, 'Nu Ahorros', 'savings', 'COP', 'Nu')
  returning id into v_savings_id;

  insert into public.accounts (user_id, name, type, currency, institution)
  values (v_user_id, 'Efectivo', 'cash', 'COP', null)
  returning id into v_cash_id;

  insert into public.accounts (user_id, name, type, currency, institution, credit_limit, cutoff_day, payment_due_day)
  values (v_user_id, 'Visa Bancolombia', 'credit_card', 'COP', 'Bancolombia', 5000000, 20, 5)
  returning id into v_card_id;

  insert into public.accounts (user_id, name, type, currency, institution)
  values (v_user_id, 'Binance', 'crypto_exchange', null, 'Binance')
  returning id into v_binance_id;

  insert into public.accounts (user_id, name, type, currency, institution)
  values (v_user_id, 'Ahorros USD', 'savings', 'USD', 'Nu')
  returning id into v_usd_savings_id;

  -- ── Card statements (previous closed cycle + current open one) ─────────────────────────────
  insert into public.card_statements (account_id, period_start, period_end, due_date, status, paid_amount)
  values (v_card_id, (v_today - interval '2 months')::date, (v_today - interval '1 month')::date, (v_today - interval '1 month' + interval '5 days')::date, 'paid', 620000)
  returning id into v_statement_prev_id;

  insert into public.card_statements (account_id, period_start, period_end, due_date, status)
  values (v_card_id, (date_trunc('month', v_today) - interval '10 days')::date, (date_trunc('month', v_today) + interval '20 days')::date, (date_trunc('month', v_today) + interval '25 days')::date, 'open')
  returning id into v_statement_curr_id;

  -- ── Income: two paychecks + one freelance gig ───────────────────────────────────────────────
  insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at) values
    (v_user_id, v_checking_id, v_cat_salario, 'income', 4200000, 'COP', 'Salario junio', (v_today - interval '1 month')::date),
    (v_user_id, v_checking_id, v_cat_salario, 'income', 4200000, 'COP', 'Salario julio', date_trunc('month', v_today)::date + 14),
    (v_user_id, v_checking_id, v_cat_freelance, 'income', 1350000, 'COP', 'Landing page cliente', (v_today - interval '18 days')::date),
    (v_user_id, v_usd_savings_id, v_cat_inversiones, 'income', 85, 'USD', 'Dividendos ETF', (v_today - interval '25 days')::date);

  -- ── Rent, utilities, subscriptions (fixed monthly-ish costs) ────────────────────────────────
  insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at) values
    (v_user_id, v_checking_id, v_cat_vivienda, 'expense', 1500000, 'COP', 'Arriendo junio', (v_today - interval '1 month')::date + 2),
    (v_user_id, v_checking_id, v_cat_vivienda, 'expense', 1500000, 'COP', 'Arriendo julio', date_trunc('month', v_today)::date + 2),
    (v_user_id, v_checking_id, v_cat_servicios, 'expense', 210000, 'COP', 'Energía', (v_today - interval '20 days')::date),
    (v_user_id, v_checking_id, v_cat_servicios, 'expense', 95000, 'COP', 'Agua', (v_today - interval '19 days')::date),
    (v_user_id, v_checking_id, v_cat_servicios, 'expense', 130000, 'COP', 'Internet y TV', (v_today - interval '15 days')::date),
    (v_user_id, v_checking_id, v_cat_suscripciones, 'expense', 45900, 'COP', 'Netflix', (v_today - interval '10 days')::date),
    (v_user_id, v_checking_id, v_cat_suscripciones, 'expense', 19900, 'COP', 'Spotify', (v_today - interval '9 days')::date),
    (v_user_id, v_checking_id, v_cat_salud, 'expense', 180000, 'COP', 'Gimnasio julio', (v_today - interval '11 days')::date);

  -- ── Credit card purchases linked to statements (Compras / Entretenimiento) ──────────────────
  insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at, card_statement_id) values
    (v_user_id, v_card_id, v_cat_compras, 'expense', 320000, 'COP', 'Zapatos', (v_today - interval '45 days')::date, v_statement_prev_id),
    (v_user_id, v_card_id, v_cat_entretenimiento, 'expense', 150000, 'COP', 'Cine y cena', (v_today - interval '40 days')::date, v_statement_prev_id),
    (v_user_id, v_card_id, v_cat_otros_gas, 'expense', 150000, 'COP', 'Ferretería', (v_today - interval '38 days')::date, v_statement_prev_id),
    (v_user_id, v_card_id, v_cat_compras, 'expense', 480000, 'COP', 'Ropa de invierno', (v_today - interval '8 days')::date, v_statement_curr_id),
    (v_user_id, v_card_id, v_cat_entretenimiento, 'expense', 95000, 'COP', 'Concierto', (v_today - interval '5 days')::date, v_statement_curr_id),
    (v_user_id, v_card_id, v_cat_educacion, 'expense', 220000, 'COP', 'Curso online', (v_today - interval '3 days')::date, v_statement_curr_id);

  -- ── Transfer between own accounts ────────────────────────────────────────────────────────
  insert into public.transactions (user_id, account_id, type, amount, currency, description, occurred_at, transfer_account_id) values
    (v_user_id, v_checking_id, 'transfer', 800000, 'COP', 'Ahorro mensual', (v_today - interval '13 days')::date, v_savings_id),
    (v_user_id, v_checking_id, 'transfer', 600000, 'COP', 'Retiro cajero', (v_today - interval '55 days')::date, v_cash_id),
    (v_user_id, v_checking_id, 'transfer', 500000, 'COP', 'Retiro cajero', (v_today - interval '21 days')::date, v_cash_id);

  -- ── Weekly groceries + biweekly transport top-ups, ~10 weeks of history (volume + realism) ─
  for v_i in 0..9 loop
    insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at)
    values (
      v_user_id,
      v_cash_id,
      v_cat_alimentacion,
      'expense',
      (60000 + (v_i * 4327) % 55000),
      'COP',
      case when v_i % 3 = 0 then 'Mercado' else 'Supermercado' end,
      (v_today - (v_i * 7 || ' days')::interval)::date
    );

    if v_i % 2 = 0 then
      insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at)
      values (v_user_id, v_checking_id, v_cat_transporte, 'expense', (35000 + (v_i * 2113) % 20000), 'COP', 'Gasolina', (v_today - (v_i * 7 + 2 || ' days')::interval)::date);
    else
      insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at)
      values (v_user_id, v_cash_id, v_cat_transporte, 'expense', (8000 + (v_i * 1531) % 12000), 'COP', 'Uber', (v_today - (v_i * 7 + 3 || ' days')::interval)::date);
    end if;
  end loop;

  -- A handful of small USD movements for multi-currency coverage.
  insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at) values
    (v_user_id, v_usd_savings_id, v_cat_compras, 'expense', 42, 'USD', 'Suscripción anual software', (v_today - interval '30 days')::date),
    (v_user_id, v_usd_savings_id, v_cat_otros_gas, 'expense', 15, 'USD', 'Comisión banco', (v_today - interval '6 days')::date);

  -- ── Recurring rules — a couple firing tomorrow / day after tomorrow, as requested ──────────
  insert into public.recurring_transactions (user_id, account_id, category_id, type, amount, currency, description, interval_unit, interval_count, start_date, next_run_date, end_date) values
    (v_user_id, v_checking_id, v_cat_salario, 'income', 4200000, 'COP', 'Salario', 'month', 1, (v_today - interval '2 months')::date, (date_trunc('month', v_today) + interval '1 month' + interval '14 days')::date, null),
    (v_user_id, v_checking_id, v_cat_vivienda, 'expense', 1500000, 'COP', 'Arriendo', 'month', 1, (v_today - interval '2 months')::date, v_today + 1, null),
    (v_user_id, v_checking_id, v_cat_suscripciones, 'expense', 45900, 'COP', 'Netflix', 'month', 1, (v_today - interval '2 months')::date, v_today + 2, null),
    (v_user_id, v_checking_id, v_cat_suscripciones, 'expense', 19900, 'COP', 'Spotify', 'month', 1, (v_today - interval '2 months')::date, v_today + 1, null),
    (v_user_id, v_checking_id, v_cat_salud, 'expense', 180000, 'COP', 'Gimnasio', 'month', 1, (v_today - interval '2 months')::date, (date_trunc('month', v_today) + interval '1 month' + interval '10 days')::date, null),
    (v_user_id, v_cash_id, v_cat_transporte, 'expense', 25000, 'COP', 'Pico y placa (SOAT mensual)', 'week', 2, (v_today - interval '1 month')::date, v_today + 2, null);

  -- ── Budgets for the current calendar month ──────────────────────────────────────────────────
  insert into public.budgets (user_id, category_id, name, amount, currency, period_start, period_end) values
    (v_user_id, v_cat_alimentacion, 'Mercado de julio', 700000, 'COP', date_trunc('month', v_today)::date, (date_trunc('month', v_today) + interval '1 month' - interval '1 day')::date),
    (v_user_id, v_cat_transporte, 'Transporte de julio', 250000, 'COP', date_trunc('month', v_today)::date, (date_trunc('month', v_today) + interval '1 month' - interval '1 day')::date),
    (v_user_id, v_cat_entretenimiento, 'Diversión de julio', 200000, 'COP', date_trunc('month', v_today)::date, (date_trunc('month', v_today) + interval '1 month' - interval '1 day')::date),
    (v_user_id, v_cat_compras, 'Compras de julio', 400000, 'COP', date_trunc('month', v_today)::date, (date_trunc('month', v_today) + interval '1 month' - interval '1 day')::date),
    (v_user_id, v_cat_servicios, 'Servicios de julio', 450000, 'COP', date_trunc('month', v_today)::date, (date_trunc('month', v_today) + interval '1 month' - interval '1 day')::date);

  -- ── Crypto activity on Binance (holdings are derived automatically by trigger) ──────────────
  insert into public.crypto_transactions (account_id, asset_symbol, type, quantity, price_per_unit, fiat_currency, fee, notes, occurred_at) values
    (v_binance_id, 'BTC', 'buy', 0.015, 385000000, 'COP', 0.00002, 'Primera compra', (v_today - interval '50 days')::date),
    (v_binance_id, 'BTC', 'buy', 0.008, 392000000, 'COP', 0.00001, null, (v_today - interval '20 days')::date),
    (v_binance_id, 'ETH', 'buy', 0.25, 14200000, 'COP', 0.0005, null, (v_today - interval '15 days')::date),
    (v_binance_id, 'USDT', 'deposit', 300, null, null, 0, 'Fondeo para trading', (v_today - interval '10 days')::date),
    (v_binance_id, 'USDT', 'withdraw', 50, null, null, 0, 'Retiro parcial', (v_today - interval '4 days')::date);

  -- ── Patrimonio (manually-tracked assets) ────────────────────────────────────────────────────
  insert into public.assets (user_id, name, category, current_value, currency, last_updated_at, notes) values
    (v_user_id, 'Apartamento Laureles', 'real_estate', 380000000, 'COP', (v_today - interval '20 days')::date, 'Avalúo catastral 2026'),
    (v_user_id, 'Mazda 3 2021', 'vehicle', 68000000, 'COP', (v_today - interval '30 days')::date, null),
    (v_user_id, 'MacBook Pro 14"', 'electronics', 8500000, 'COP', (v_today - interval '60 days')::date, null),
    (v_user_id, 'Reloj Seiko', 'valuable', 2200000, 'COP', (v_today - interval '90 days')::date, 'Regalo de grado');

  raise notice 'Seeded demo data for user % (demo@demo.com)', v_user_id;
end $$;
