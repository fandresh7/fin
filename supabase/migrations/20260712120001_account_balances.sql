-- Live account balance, computed from the transactions ledger rather than cached, so it can
-- never drift from the movements that produced it. Money leaving an account (expense, or a
-- transfer where it's the source) subtracts; money arriving (income, or a transfer where it's
-- the destination) adds. Crypto_exchange accounts don't use this table for their activity
-- (see crypto_transactions/crypto_holdings), so they'll simply show a balance of 0 here.

create view public.account_balances
with (security_invoker = true) as
select
  a.id as account_id,
  a.user_id,
  coalesce(sum(
    case
      when t.account_id = a.id and t.type = 'income' then t.amount
      when t.account_id = a.id and t.type = 'expense' then -t.amount
      when t.account_id = a.id and t.type = 'transfer' then -t.amount
      when t.transfer_account_id = a.id and t.type = 'transfer' then t.amount
      else 0
    end
  ), 0) as balance
from public.accounts a
left join public.transactions t
  on t.account_id = a.id or t.transfer_account_id = a.id
group by a.id, a.user_id;
