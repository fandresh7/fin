-- The original apply_crypto_transaction trigger only fired on INSERT, so editing or deleting a
-- crypto_transactions row left crypto_holdings permanently out of sync with the ledger. Now that
-- the UI supports editing/deleting these rows, holdings must be corrected on all three operations:
-- reverse the old row's effect (on UPDATE/DELETE) and apply the new row's effect (on INSERT/UPDATE).

create or replace function public.apply_crypto_transaction()
returns trigger
language plpgsql
as $$
declare
  old_delta numeric(28, 10) := 0;
  new_delta numeric(28, 10) := 0;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    old_delta := case
      when old.type in ('buy', 'deposit', 'swap_in') then old.quantity
      else -old.quantity
    end;

    update public.crypto_holdings
    set quantity = quantity - old_delta, updated_at = now()
    where account_id = old.account_id and asset_symbol = old.asset_symbol;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    new_delta := case
      when new.type in ('buy', 'deposit', 'swap_in') then new.quantity
      else -new.quantity
    end;

    insert into public.crypto_holdings (account_id, asset_symbol, quantity)
    values (new.account_id, new.asset_symbol, new_delta)
    on conflict (account_id, asset_symbol)
    do update set quantity = crypto_holdings.quantity + excluded.quantity, updated_at = now();
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger crypto_transactions_apply on public.crypto_transactions;

create trigger crypto_transactions_apply
  after insert or update or delete on public.crypto_transactions
  for each row
  execute function public.apply_crypto_transaction();
