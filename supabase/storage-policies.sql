insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = excluded.public;

create policy "property-images public read"
on storage.objects
for select
to public
using (bucket_id = 'property-images');

create policy "property-images app upload"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'property-images');

create policy "property-images app update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'property-images')
with check (bucket_id = 'property-images');

create policy "property-images app delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'property-images');
