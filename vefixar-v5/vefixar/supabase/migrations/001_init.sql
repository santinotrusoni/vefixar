create extension if not exists pgcrypto;
create table profiles(id uuid primary key references auth.users on delete cascade, full_name text, role text not null default 'employee' check(role in('admin','employee')));
create function is_staff() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid()) $$;
create function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
create table settings(id int primary key default 1 check(id=1), business_name text default 'VEFIXAR', slogan text default 'LÍDERES EN REPARACIÓN', whatsapp text, phone text, address text, hours text, usd_rate numeric, usd_rate_updated timestamptz, rounding int default 1000);
insert into settings(id) values(1);
create table categories(id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, active bool default true, sort int default 0);
create table products(id uuid primary key default gen_random_uuid(), kind text not null default 'accessory' check(kind in('iphone','accessory','other')), name text not null, sku text unique, barcode text, category_id uuid references categories, brand text, model text, condition text check(condition in('new','used','outlet')), storage text, color text, battery_pct int check(battery_pct between 0 and 100), description text, images text[] default '{}', cost_price numeric, price numeric not null check(price>=0), currency text not null default 'USD' check(currency in('USD','ARS')), price_ars_manual numeric, stock int not null default 0 check(stock>=0), min_stock int not null default 0, imei text, internal_notes text, published bool default false, deleted_at timestamptz, created_at timestamptz default now());
create table services(id uuid primary key default gen_random_uuid(), name text not null, description text, image text, devices text, price_hint numeric, eta text, published bool default true, sort int default 0, deleted_at timestamptz);
create table customers(id uuid primary key default gen_random_uuid(), name text not null, phone text, email text, notes text, created_at timestamptz default now());
create table repairs(id uuid primary key default gen_random_uuid(), order_no bigint generated always as identity, track_token uuid not null default gen_random_uuid(), customer_id uuid references customers, device text, brand_model text, imei text, issue text, diagnosis text, quote numeric, deposit numeric default 0, status text not null default 'received', created_by uuid default auth.uid(), created_at timestamptz default now(), delivered_at timestamptz);
create table repair_history(id uuid primary key default gen_random_uuid(), repair_id uuid references repairs on delete cascade, status text, user_id uuid default auth.uid(), at timestamptz default now());
create table sales(id uuid primary key default gen_random_uuid(), total numeric not null, payments jsonb not null, user_id uuid default auth.uid(), status text not null default 'completed' check(status in('completed','voided','returned')), created_at timestamptz default now());
create table sale_items(id uuid primary key default gen_random_uuid(), sale_id uuid references sales, product_id uuid references products, qty int not null check(qty>0), unit_price numeric not null, unit_cost numeric);
create table stock_movements(id uuid primary key default gen_random_uuid(), product_id uuid references products, qty int not null, reason text not null, ref uuid, user_id uuid default auth.uid(), created_at timestamptz default now());
create table expenses(id uuid primary key default gen_random_uuid(), concept text not null, category text, amount numeric not null, user_id uuid default auth.uid(), created_at timestamptz default now());
create table cash_sessions(id uuid primary key default gen_random_uuid(), opened_by uuid default auth.uid(), opening numeric not null, opened_at timestamptz default now(), closed_at timestamptz, counted numeric, notes text);
do $$ declare t text; begin
 foreach t in array array['profiles','settings','categories','products','services','customers','repairs','repair_history','sales','sale_items','stock_movements','expenses','cash_sessions'] loop
  execute format('alter table %I enable row level security',t);
  if t not in('expenses','profiles','settings') then execute format('create policy staff_all on %I for all using(is_staff()) with check(is_staff())',t); end if;
 end loop; end $$;
create policy exp_admin on expenses for all using(is_admin()) with check(is_admin());
create policy prof_self on profiles for select using(id=auth.uid() or is_admin());
create policy prof_admin on profiles for all using(is_admin()) with check(is_admin());
create policy set_read on settings for select using(true);
create policy set_admin on settings for update using(is_admin());
create view products_public as select id,kind,name,brand,model,condition,storage,color,battery_pct,description,images,price,currency,price_ars_manual,stock,category_id,created_at from products where published and deleted_at is null;
create view services_public as select id,name,description,image,devices,price_hint,eta,sort from services where published and deleted_at is null;
grant select on products_public, services_public, settings to anon, authenticated;
create function create_sale(items jsonb, payments jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare sid uuid; it jsonb; p products; tot numeric:=0; paid numeric;
begin
 if not is_staff() then raise exception 'No autorizado'; end if;
 insert into sales(total,payments) values(0,payments) returning id into sid;
 for it in select * from jsonb_array_elements(items) loop
  select * into p from products where id=(it->>'product_id')::uuid and deleted_at is null for update;
  if not found or p.stock<(it->>'qty')::int then raise exception 'Stock insuficiente: %',coalesce(p.name,'?'); end if;
  insert into sale_items(sale_id,product_id,qty,unit_price,unit_cost) values(sid,p.id,(it->>'qty')::int,(it->>'unit_price')::numeric,p.cost_price);
  update products set stock=stock-(it->>'qty')::int where id=p.id;
  insert into stock_movements(product_id,qty,reason,ref) values(p.id,-(it->>'qty')::int,'venta',sid);
  tot:=tot+(it->>'qty')::int*(it->>'unit_price')::numeric;
 end loop;
 select coalesce(sum((x->>'amount')::numeric),0) into paid from jsonb_array_elements(payments) x;
 if paid<>tot then raise exception 'Los pagos (%) no coinciden con el total (%)',paid,tot; end if;
 update sales set total=tot where id=sid; return sid;
end $$;
-- Crear admin: registrá un usuario en Authentication y luego:
-- insert into profiles(id,full_name,role) values('<UUID_DEL_USUARIO>','Dueño','admin');
