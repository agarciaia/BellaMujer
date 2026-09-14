-- BellaMujer FASE 2
-- Ejecutar en el SQL Editor del proyecto Supabase BellaMujer.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  price int not null check (price >= 0),
  compare_at_price int check (compare_at_price is null or compare_at_price >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text,
  color text,
  stock int not null default 0 check (stock >= 0),
  sku text,
  active boolean not null default true,
  unique(product_id, size, color)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price int check (price is null or price >= 0),
  image_path text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  address text,
  commune text,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_email text,
  source text not null default 'cart' check (source in ('cart','direct','service')),
  status text not null default 'new' check (status in ('new','contacted','confirmed','delivered','cancelled')),
  total int not null default 0 check (total >= 0),
  whatsapp_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  item_name text not null,
  unit_price int not null default 0 check (unit_price >= 0),
  quantity int not null default 1 check (quantity > 0),
  size text,
  color text
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_path text,
  link text,
  active boolean not null default true,
  sort_order int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'BellaMujer',
  hero_title text not null default 'Elegancia que se siente tuya',
  hero_text text,
  whatsapp text,
  instagram text,
  tiktok text,
  facebook text,
  dispatch_text text,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

insert into public.categories(name,slug,sort_order) values
('Faldas','faldas',10),('Blusas','blusas',20),('Vestidos','vestidos',30),('Cinturones','cinturones',40),('Ropa de Iglesia','ropa-de-iglesia',50)
on conflict (slug) do nothing;

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.services enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.promotions enable row level security;
alter table public.store_settings enable row level security;

-- Admins: solo pueden leer su propio registro.
create policy "admin read self" on public.admin_users for select to authenticated
using ((select auth.uid()) = user_id);

-- Catálogo público de solo lectura.
create policy "public read categories" on public.categories for select to anon, authenticated using (active = true);
create policy "public read products" on public.products for select to anon, authenticated using (active = true);
create policy "public read product images" on public.product_images for select to anon, authenticated using (true);
create policy "public read product variants" on public.product_variants for select to anon, authenticated using (active = true);
create policy "public read services" on public.services for select to anon, authenticated using (active = true);
create policy "public read promotions" on public.promotions for select to anon, authenticated using (active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "public read settings" on public.store_settings for select to anon, authenticated using (true);

-- Perfil: cada cliente gestiona solo el suyo.
create policy "profile select own" on public.customer_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profile insert own" on public.customer_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profile update own" on public.customer_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Pedidos: el cliente puede crear y consultar solo los suyos. Los invitados pueden crear pedidos sin user_id.
create policy "anon insert orders" on public.orders for insert to anon with check (customer_user_id is null);
create policy "auth insert orders" on public.orders for insert to authenticated with check (customer_user_id is null or customer_user_id = (select auth.uid()));
create policy "auth read own orders" on public.orders for select to authenticated using (customer_user_id = (select auth.uid()));
create policy "anon insert order items" on public.order_items for insert to anon with check (true);
create policy "auth insert order items" on public.order_items for insert to authenticated with check (true);

-- Escritura administrativa en tablas de negocio.
create policy "admin all categories" on public.categories for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin all products" on public.products for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin all product images" on public.product_images for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin all product variants" on public.product_variants for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin all services" on public.services for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin all promotions" on public.promotions for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin all settings" on public.store_settings for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin read orders" on public.orders for select to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())) or customer_user_id = (select auth.uid()));
create policy "admin update orders" on public.orders for update to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin read order items" on public.order_items for select to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));

-- Storage público para imágenes del catálogo. Solo administradores pueden escribir.
insert into storage.buckets (id,name,public) values ('product-images','product-images',true)
on conflict (id) do update set public = excluded.public;

create policy "public read product images bucket" on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');
create policy "admin upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (bucket_id = 'product-images' and exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admin delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));

-- Grants para Data API.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.product_variants, public.services, public.promotions, public.store_settings to anon, authenticated;
grant select, insert, update on public.customer_profiles to authenticated;
grant select, insert, update on public.orders to authenticated;
grant insert on public.orders to anon;
grant select, insert on public.order_items to authenticated;
grant insert on public.order_items to anon;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images, public.product_variants, public.services, public.promotions, public.store_settings to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
