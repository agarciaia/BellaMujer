create schema if not exists private;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  name text not null check (char_length(name) between 2 and 80),
  whatsapp text not null default '',
  instagram text not null default '',
  tiktok text not null default '',
  address text not null default '',
  hero_image_url text not null default '',
  logo_url text not null default '',
  primary_color text not null default '#772640',
  published boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null default 'admin' check (role in ('admin','editor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (business_id,user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  category text not null default 'Productos',
  description text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  old_price numeric(12,2) not null default 0 check (old_price >= 0),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  image_url text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.user_can_manage(target_business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    (select auth.uid()) = '253c6a3c-f4b9-4be6-95f2-0c081789bf04'::uuid
    or exists (
      select 1 from public.business_members bm
      where bm.business_id = target_business
        and bm.user_id = (select auth.uid())
        and bm.active
    ));
$$;

revoke all on function private.user_can_manage(uuid) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.user_can_manage(uuid) to anon, authenticated;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.products enable row level security;

create policy "public reads published businesses" on public.businesses
for select to anon, authenticated
using (published or private.user_can_manage(id));

create policy "members update their business" on public.businesses
for update to authenticated
using (private.user_can_manage(id))
with check (private.user_can_manage(id));

create policy "superadmin creates businesses" on public.businesses
for insert to authenticated
with check ((select auth.uid()) = '253c6a3c-f4b9-4be6-95f2-0c081789bf04'::uuid);

create policy "members view membership" on public.business_members
for select to authenticated
using (
  user_id = (select auth.uid())
  or (select auth.uid()) = '253c6a3c-f4b9-4be6-95f2-0c081789bf04'::uuid
);

create policy "superadmin manages memberships" on public.business_members
for all to authenticated
using ((select auth.uid()) = '253c6a3c-f4b9-4be6-95f2-0c081789bf04'::uuid)
with check ((select auth.uid()) = '253c6a3c-f4b9-4be6-95f2-0c081789bf04'::uuid);

create policy "public reads active products" on public.products
for select to anon, authenticated
using (
  (active and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.published
  ))
  or private.user_can_manage(business_id)
);

create policy "members create products" on public.products
for insert to authenticated
with check (private.user_can_manage(business_id));

create policy "members update products" on public.products
for update to authenticated
using (private.user_can_manage(business_id))
with check (private.user_can_manage(business_id));

create policy "members delete products" on public.products
for delete to authenticated
using (private.user_can_manage(business_id));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads product images" on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');

create policy "members upload product images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and private.user_can_manage(b.id)
  )
);

create policy "members replace product images" on storage.objects
for update to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and private.user_can_manage(b.id)
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and private.user_can_manage(b.id)
  )
);

create policy "members delete product images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and private.user_can_manage(b.id)
  )
);

grant select on public.businesses, public.products to anon;
grant select,insert,update,delete on public.businesses,public.business_members,public.products to authenticated;

insert into public.businesses (slug,name,created_by)
values ('bellamujer','BellaMujer','253c6a3c-f4b9-4be6-95f2-0c081789bf04')
on conflict (slug) do nothing;

insert into public.business_members (business_id,user_id,username,role)
select id,'253c6a3c-f4b9-4be6-95f2-0c081789bf04','superadmin','admin'
from public.businesses where slug='bellamujer'
on conflict (business_id,user_id) do nothing;

create index products_business_idx on public.products(business_id);
create index business_members_user_idx on public.business_members(user_id);
create index businesses_created_by_idx on public.businesses(created_by);
