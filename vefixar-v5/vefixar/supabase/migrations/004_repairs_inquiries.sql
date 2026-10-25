create table inquiries(id uuid primary key default gen_random_uuid(), kind text not null check(kind in('consulta','canje')), name text not null, phone text not null, message text, data jsonb not null default '{}', status text not null default 'new', created_at timestamptz default now());
create table repair_parts(id uuid primary key default gen_random_uuid(), repair_id uuid references repairs on delete cascade, product_id uuid references products, qty int not null check(qty>0), unit_cost numeric, user_id uuid default auth.uid(), created_at timestamptz default now());
alter table inquiries enable row level security; alter table repair_parts enable row level security;
create policy staff_all on inquiries for all using(is_staff()) with check(is_staff());
create policy staff_all on repair_parts for all using(is_staff()) with check(is_staff());
create function submit_inquiry(p_kind text,p_name text,p_phone text,p_message text,p_data jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
 if length(trim(coalesce(p_name,'')))<2 or length(p_name)>100 or length(regexp_replace(coalesce(p_phone,''),'\D','','g')) not between 8 and 15 or length(coalesce(p_message,''))>2000 then raise exception 'Datos inválidos'; end if;
 if (select count(*) from inquiries where phone=p_phone and created_at>now()-interval '10 minutes')>=3 then raise exception 'Demasiadas consultas, probá más tarde'; end if;
 insert into inquiries(kind,name,phone,message,data) values(p_kind,trim(p_name),p_phone,p_message,coalesce(p_data,'{}'));
end $$;
create function get_repair_status(tok uuid) returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('order_no',r.order_no,'device',r.brand_model,'status',r.status,'history',(select coalesce(jsonb_agg(jsonb_build_object('status',h.status,'at',h.at) order by h.at),'[]') from repair_history h where h.repair_id=r.id)) from repairs r where r.track_token=tok $$;
grant execute on function submit_inquiry, get_repair_status to anon, authenticated;
create function use_repair_part(rid uuid,pid uuid,q int) returns void language plpgsql security definer set search_path=public as $$
declare p products;
begin
 if not is_staff() then raise exception 'No autorizado'; end if;
 select * into p from products where id=pid and deleted_at is null for update;
 if not found or p.stock<q then raise exception 'Stock insuficiente'; end if;
 insert into repair_parts(repair_id,product_id,qty,unit_cost) values(rid,pid,q,case when p.currency='USD' then p.cost_price*(select usd_rate from settings where id=1) else p.cost_price end);
 update products set stock=stock-q where id=pid;
 insert into stock_movements(product_id,qty,reason,ref) values(pid,-q,'reparacion',rid);
end $$;
