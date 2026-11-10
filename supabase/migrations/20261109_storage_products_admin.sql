-- Seguridad de las fotos (Storage, bucket "products"): solo el admin sube, cambia o borra.
--
-- Antes: "Permitir a administradores subir/borrar imágenes" se aplicaban a "authenticated",
-- es decir, a cualquier usuario con sesión. Además había dos políticas de lectura repetidas.
--
-- Requiere haber corrido antes 20261107_admin_role_rls.sql (crea public.is_admin()).
-- Cómo correrlo: Supabase → SQL Editor → pega todo el archivo → Run.

begin;

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Primero corre 20261107_admin_role_rls.sql (crea public.is_admin)';
  end if;
end $$;

-- 1. Quita las políticas actuales de Storage. Hoy "products" es el único bucket, así que se
--    borran todas para no depender de cómo se escribió cada una.
do $$
declare
  policy record;
begin
  for policy in
    select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy %I on storage.objects', policy.policyname);
  end loop;
end $$;

-- 2. Solo el admin opera sobre los archivos del bucket.
--    No hace falta una política de lectura pública: el bucket es público, así que las fotos se
--    sirven por su URL sin ella. Sin esa política, además, nadie puede listar todos los archivos.
create policy "Admin lee fotos de productos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));

create policy "Admin sube fotos de productos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products' and (select public.is_admin()));

create policy "Admin reemplaza fotos de productos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products' and (select public.is_admin()))
  with check (bucket_id = 'products' and (select public.is_admin()));

create policy "Admin borra fotos de productos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));

commit;
