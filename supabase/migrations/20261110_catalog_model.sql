-- Modelo del catálogo para el admin y la tienda:
--   · subcategorías por categoría (Hoops, Studs…) y colecciones (Molten, Deia…)
--   · campos nuevos en productos: subcategoría, colección, detalles, destacado, orden
--   · varias fotos por producto en product_images, con orden y opcionalmente por metal
--
-- Requiere 20261107_admin_role_rls.sql (crea public.is_admin()).
-- Cómo correrlo: Supabase → SQL Editor → pega todo el archivo → Run. Se puede correr dos veces sin romper nada.

begin;

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Primero corre 20261107_admin_role_rls.sql (crea public.is_admin)';
  end if;
end $$;

-- 1. Colecciones ------------------------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Subcategorías: cada una pertenece a una categoría; el slug se repite entre categorías ------
create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);
create index if not exists subcategories_category_id_idx on public.subcategories (category_id);

alter table public.categories add column if not exists sort_order integer not null default 0;

-- 3. Productos ----------------------------------------------------------------------------------
alter table public.products
  add column if not exists subcategory_id uuid references public.subcategories (id) on delete set null,
  add column if not exists collection_id uuid references public.collections (id) on delete set null,
  add column if not exists details text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_subcategory_id_idx on public.products (subcategory_id);
create index if not exists products_collection_id_idx on public.products (collection_id);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

-- updated_at se mantiene solo
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- 4. Fotos ----------------------------------------------------------------------------------------
-- La columna se llamaba cloudinary_url, pero las fotos viven en Supabase Storage
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_images' and column_name = 'cloudinary_url'
  ) then
    alter table public.product_images rename column cloudinary_url to url;
  end if;
end $$;

alter table public.product_images
  -- Metal al que pertenece la foto (igual que product_variants.material); vacío = sirve para todos
  add column if not exists material text,
  add column if not exists created_at timestamptz not null default now();

update public.product_images set display_order = 0 where display_order is null;
alter table public.product_images alter column display_order set default 0;
alter table public.product_images alter column display_order set not null;
create index if not exists product_images_product_id_idx on public.product_images (product_id, display_order);

-- Al borrar un producto se van sus fotos y sus variantes con él
-- (si una variante ya tiene pedidos, la base de datos impedirá borrarla: hay que archivar)
alter table public.product_images drop constraint if exists product_images_product_id_fkey;
alter table public.product_images
  add constraint product_images_product_id_fkey
  foreign key (product_id) references public.products (id) on delete cascade;

alter table public.product_variants drop constraint if exists product_variants_product_id_fkey;
alter table public.product_variants
  add constraint product_variants_product_id_fkey
  foreign key (product_id) references public.products (id) on delete cascade;

-- La foto única que había en products.image_url pasa a ser la primera de la galería
insert into public.product_images (product_id, url, alt_text, display_order)
select p.id, p.image_url, p.title, 0
from public.products p
where p.image_url is not null
  and not exists (select 1 from public.product_images i where i.product_id = p.id);

-- 5. Seguridad de las tablas nuevas (mismo criterio que el resto del catálogo) -------------------
alter table public.collections enable row level security;
alter table public.subcategories enable row level security;

drop policy if exists "Lectura pública de colecciones activas" on public.collections;
create policy "Lectura pública de colecciones activas"
  on public.collections for select
  to anon, authenticated
  using (is_active = true or (select public.is_admin()));

drop policy if exists "Admin escribe colecciones" on public.collections;
create policy "Admin escribe colecciones"
  on public.collections for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Lectura pública de subcategorías" on public.subcategories;
create policy "Lectura pública de subcategorías"
  on public.subcategories for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin escribe subcategorías" on public.subcategories;
create policy "Admin escribe subcategorías"
  on public.subcategories for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.collections, public.subcategories to anon, authenticated;
grant insert, update, delete on public.collections, public.subcategories to authenticated;

commit;
