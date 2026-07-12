-- Sample data for manual testing. Targets a specific real user (created via the dashboard,
-- since public signup is disabled) rather than a fixture user, since this is a single-user app.
-- Safe to re-run: it wipes this user's existing accounts/transactions/budgets/crypto data first
-- (categories are left alone since handle_new_user already seeded them and other rows reference
-- them by name lookup below).

do $$
declare
  v_user_id uuid := '3c13cdcb-52da-401c-b150-0a8809f76373';

  v_checking_id uuid;
  v_savings_id uuid;
  v_cash_id uuid;
  v_credit_card_id uuid;
  v_crypto_id uuid;

  v_statement_id uuid;

  v_cat_salario uuid;
  v_cat_freelance uuid;
  v_cat_vivienda uuid;
  v_cat_alimentacion uuid;
  v_cat_transporte uuid;
  v_cat_entretenimiento uuid;
  v_cat_compras uuid;
  v_cat_servicios uuid;
  v_cat_suscripciones uuid;
begin
  -- Reset this user's transactional data so the seed can be re-run safely.
  delete from public.transactions where user_id = v_user_id;
  delete from public.crypto_transactions where account_id in (select id from public.accounts where user_id = v_user_id);
  delete from public.card_statements where account_id in (select id from public.accounts where user_id = v_user_id);
  delete from public.budgets where user_id = v_user_id;
  delete from public.accounts where user_id = v_user_id;

  -- Accounts
  insert into public.accounts (id, user_id, name, type, currency, institution)
  values (gen_random_uuid(), v_user_id, 'Cuenta Nu', 'checking', 'COP', 'Nu')
  returning id into v_checking_id;

  insert into public.accounts (id, user_id, name, type, currency, institution)
  values (gen_random_uuid(), v_user_id, 'Ahorros Bancolombia', 'savings', 'COP', 'Bancolombia')
  returning id into v_savings_id;

  insert into public.accounts (id, user_id, name, type, currency)
  values (gen_random_uuid(), v_user_id, 'Efectivo', 'cash', 'COP')
  returning id into v_cash_id;

  insert into public.accounts (id, user_id, name, type, currency, institution, credit_limit, cutoff_day, payment_due_day)
  values (gen_random_uuid(), v_user_id, 'Visa Bancolombia', 'credit_card', 'COP', 'Bancolombia', 5000000, 20, 5)
  returning id into v_credit_card_id;

  insert into public.accounts (id, user_id, name, type, institution)
  values (gen_random_uuid(), v_user_id, 'Binance', 'crypto_exchange', 'Binance')
  returning id into v_crypto_id;

  -- Category lookups (seeded by handle_new_user on signup)
  select id into v_cat_salario from public.categories where user_id = v_user_id and name = 'Salario';
  select id into v_cat_freelance from public.categories where user_id = v_user_id and name = 'Freelance';
  select id into v_cat_vivienda from public.categories where user_id = v_user_id and name = 'Vivienda';
  select id into v_cat_alimentacion from public.categories where user_id = v_user_id and name = 'Alimentación';
  select id into v_cat_transporte from public.categories where user_id = v_user_id and name = 'Transporte';
  select id into v_cat_entretenimiento from public.categories where user_id = v_user_id and name = 'Entretenimiento';
  select id into v_cat_compras from public.categories where user_id = v_user_id and name = 'Compras';
  select id into v_cat_servicios from public.categories where user_id = v_user_id and name = 'Servicios';
  select id into v_cat_suscripciones from public.categories where user_id = v_user_id and name = 'Suscripciones';

  -- Credit card statement (June 21 - July 20), purchases below link into it
  insert into public.card_statements (id, account_id, period_start, period_end, due_date)
  values (gen_random_uuid(), v_credit_card_id, '2026-06-21', '2026-07-20', '2026-08-05')
  returning id into v_statement_id;

  -- Income
  insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at) values
    (v_user_id, v_checking_id, v_cat_salario, 'income', 4200000, 'COP', 'Nómina junio', '2026-06-30'),
    (v_user_id, v_checking_id, v_cat_salario, 'income', 4200000, 'COP', 'Nómina julio', '2026-07-15'),
    (v_user_id, v_checking_id, v_cat_freelance, 'income', 650000, 'COP', 'Proyecto freelance', '2026-07-08');

  -- Expenses on checking / cash
  insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at) values
    (v_user_id, v_checking_id, v_cat_vivienda, 'expense', 1350000, 'COP', 'Arriendo julio', '2026-07-05'),
    (v_user_id, v_checking_id, v_cat_servicios, 'expense', 185000, 'COP', 'Energía y agua', '2026-07-06'),
    (v_user_id, v_checking_id, v_cat_servicios, 'expense', 95000, 'COP', 'Internet', '2026-07-06'),
    (v_user_id, v_checking_id, v_cat_suscripciones, 'expense', 44900, 'COP', 'Netflix + Spotify', '2026-07-02'),
    (v_user_id, v_cash_id, v_cat_alimentacion, 'expense', 38000, 'COP', 'Almuerzo', '2026-07-09'),
    (v_user_id, v_cash_id, v_cat_transporte, 'expense', 15000, 'COP', 'Taxi', '2026-07-09'),
    (v_user_id, v_cash_id, v_cat_alimentacion, 'expense', 22000, 'COP', 'Café y algo', '2026-07-10'),
    (v_user_id, v_checking_id, v_cat_alimentacion, 'expense', 210000, 'COP', 'Mercado', '2026-06-28');

  -- Credit card purchases, linked to the statement above
  insert into public.transactions (user_id, account_id, category_id, type, amount, currency, description, occurred_at, card_statement_id) values
    (v_user_id, v_credit_card_id, v_cat_alimentacion, 'expense', 152000, 'COP', 'Supermercado', '2026-06-25', v_statement_id),
    (v_user_id, v_credit_card_id, v_cat_entretenimiento, 'expense', 68000, 'COP', 'Cine', '2026-06-29', v_statement_id),
    (v_user_id, v_credit_card_id, v_cat_compras, 'expense', 249900, 'COP', 'Ropa', '2026-07-03', v_statement_id),
    (v_user_id, v_credit_card_id, v_cat_transporte, 'expense', 120000, 'COP', 'Gasolina', '2026-07-07', v_statement_id),
    (v_user_id, v_credit_card_id, v_cat_entretenimiento, 'expense', 89000, 'COP', 'Restaurante', '2026-07-10', v_statement_id);

  -- Transfer: paying part of the previous statement from checking
  insert into public.transactions (user_id, account_id, type, amount, currency, description, occurred_at, transfer_account_id) values
    (v_user_id, v_checking_id, 'transfer', 400000, 'COP', 'Pago tarjeta Visa', '2026-07-04', v_credit_card_id);

  -- Budget for the current month
  insert into public.budgets (user_id, category_id, name, amount, currency, period_start, period_end)
  values (v_user_id, v_cat_alimentacion, 'Alimentación julio', 800000, 'COP', '2026-07-01', '2026-07-31');

  -- Crypto activity (crypto_holdings is derived automatically by the existing trigger)
  insert into public.crypto_transactions (account_id, asset_symbol, type, quantity, price_per_unit, fiat_currency, occurred_at) values
    (v_crypto_id, 'USDT', 'deposit', 300, null, null, '2026-06-15'),
    (v_crypto_id, 'BTC', 'buy', 0.015, 385000000, 'COP', '2026-06-16'),
    (v_crypto_id, 'BTC', 'buy', 0.008, 392000000, 'COP', '2026-07-01'),
    (v_crypto_id, 'ETH', 'buy', 0.25, 14200000, 'COP', '2026-07-05');
end $$;
