alter table cash_sessions add column expected numeric;
create function lock_closed_cash() returns trigger language plpgsql as $$ begin
 if old.closed_at is not null then raise exception 'Una caja cerrada no se puede modificar'; end if; return new; end $$;
create trigger cash_lock before update on cash_sessions for each row execute function lock_closed_cash();
create or replace function create_sale(items jsonb, payments jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare sid uuid; it jsonb; p products; tot numeric:=0; paid numeric; cst numeric;
begin
 if not is_staff() then raise exception 'No autorizado'; end if;
 insert into sales(total,payments) values(0,payments) returning id into sid;
 for it in select * from jsonb_array_elements(items) loop
  select * into p from products where id=(it->>'product_id')::uuid and deleted_at is null for update;
  if not found or p.stock<(it->>'qty')::int then raise exception 'Stock insuficiente: %',coalesce(p.name,'?'); end if;
  cst:=case when p.currency='USD' then p.cost_price*(select usd_rate from settings where id=1) else p.cost_price end;
  insert into sale_items(sale_id,product_id,qty,unit_price,unit_cost) values(sid,p.id,(it->>'qty')::int,(it->>'unit_price')::numeric,cst);
  update products set stock=stock-(it->>'qty')::int where id=p.id;
  insert into stock_movements(product_id,qty,reason,ref) values(p.id,-(it->>'qty')::int,'venta',sid);
  tot:=tot+(it->>'qty')::int*(it->>'unit_price')::numeric;
 end loop;
 select coalesce(sum((x->>'amount')::numeric),0) into paid from jsonb_array_elements(payments) x;
 if paid<>tot then raise exception 'Los pagos (%) no coinciden con el total (%)',paid,tot; end if;
 update sales set total=tot where id=sid; return sid;
end $$;
create function void_sale(sid uuid) returns void language plpgsql security definer set search_path=public as $$
declare s sales; it sale_items;
begin
 if not is_admin() then raise exception 'Solo el administrador puede anular'; end if;
 select * into s from sales where id=sid for update;
 if not found or s.status<>'completed' then raise exception 'Venta no anulable'; end if;
 for it in select * from sale_items where sale_id=sid loop
  update products set stock=stock+it.qty where id=it.product_id;
  insert into stock_movements(product_id,qty,reason,ref) values(it.product_id,it.qty,'anulacion',sid);
 end loop;
 update sales set status='voided' where id=sid;
end $$;
