-- Seguridad del catálogo: solo el rol "admin" puede escribir; el público solo lee lo activo.
--
-- Antes: las políticas "Admin full access ..." daban permiso total a CUALQUIER usuario con sesión
-- (rol "authenticated"). Con el registro abierto, cualquiera podía crear una cuenta y borrar o
-- cambiar productos usando la llave pública de la web.
--
-- Cómo correrlo: Supabase → SQL Editor → pega todo el archivo → Run.
-- ANTES de correrlo, cambia el correo del paso 1 por el de tu cuenta de administrador.
-- Después: cierra sesión en /admin y vuelve a entrar (el permiso viaja dentro de la sesión).

begin;

-- 1. Marca tu cuenta como administradora. app_metadata solo se puede cambiar desde el servidor
--    o este editor; un usuario no puede dárselo a sí mismo.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
where email = 'TU-CORREO-ADMIN@ejemplo.com';

-- Si el correo no coincide con ningún usuario, se cancela todo para no dejarte sin acceso
do $$
begin
  if not exists (select 1 from auth.users where raw_app_meta_data ->> 'role' = 'admin') then
    raise exception 'Ningún usuario quedó como admin: revisa el correo del paso 1';
  end if;
end $$;

-- 2. ¿La sesión actual es de un administrador?
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- 3. Quita TODAS las políticas actuales del catálogo (incluidas las duplicadas) para empezar limpio
do $$
declare
  policy record;
begin
  for policy in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('categories', 'products', 'product_variants', 'product_images')
  loop
    execute format('drop policy %I on public.%I', policy.policyname, policy.tablename);
  end loop;
end $$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

-- 4. Lectura pública: categorías, y solo productos activos (con sus variantes y fotos).
--    El admin ve también los borradores.
create policy "Lectura pública de categorías"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Lectura pública de productos activos"
  on public.products for select
  to anon, authenticated
  using (is_active = true or (select public.is_admin()));

create policy "Lectura pública de variantes de productos activos"
  on public.product_variants for select
  to anon, authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );

create policy "Lectura pública de fotos de productos activos"
  on public.product_images for select
  to anon, authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );

-- 5. Escritura: solo administradores
create policy "Admin escribe categorías"
  on public.categories for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin escribe productos"
  on public.products for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin escribe variantes"
  on public.product_variants for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin escribe fotos"
  on public.product_images for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 6. Permisos de la API de datos (las políticas de arriba siguen decidiendo qué filas se ven).
--    orders y order_items NO se exponen: los pedidos los escribirá el servidor con la llave privada.
grant select on public.categories, public.products, public.product_variants, public.product_images to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_variants, public.product_images to authenticated;

commit;
