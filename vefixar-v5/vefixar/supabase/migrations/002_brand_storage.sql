alter table settings add column instagram text, add column experience text;
update settings set instagram='https://instagram.com/vefixar', experience='+8 años de experiencia';
-- Completar WhatsApp (solo dígitos, ej. 549XXXXXXXXXX): update settings set whatsapp='...' where id=1;
insert into storage.buckets(id,name,public) values('products','products',true) on conflict do nothing;
create policy "products read" on storage.objects for select using(bucket_id='products');
create policy "products staff write" on storage.objects for insert with check(bucket_id='products' and is_staff());
