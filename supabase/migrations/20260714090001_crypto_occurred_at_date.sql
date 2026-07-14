-- crypto_transactions.occurred_at was timestamptz while every other ledger table (transactions,
-- recurring_transactions) uses plain date — the mismatch is why crypto rows showed a full
-- "2026-07-05T00:00:00+00:00" timestamp in the UI instead of a date. The form only ever collects
-- a date (no time-of-day picker), so timestamptz added nothing but the display bug.

alter table public.crypto_transactions
  alter column occurred_at type date using occurred_at::date,
  alter column occurred_at set default current_date;
