-- Tienda AG: least-privilege Data API, public storefront RPC and atomic catalog operations.

create or replace function private.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) = '253c6a3c-f4b9-4be6-95f2-0c081789bf04'::uuid
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'superadmin';
$$;

revoke all on function private.is_superadmin() from public, anon;
grant execute on function private.is_superadmin() to authenticated;

create or replace function private.user_can_manage(target_business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.is_superadmin()
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = target_business
        and bm.user_id = (select auth.uid())
        and bm.active
        and (bm.trial_ends_at is null or bm.trial_ends_at > now())
    )
  );
$$;

revoke all on function private.user_can_manage(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.user_can_manage(uuid) to authenticated;

drop policy if exists "public reads published businesses" on public.businesses;
drop policy if exists "public reads active products" on public.products;
drop policy if exists "public reads active categories" on public.categories;

create policy "managers read businesses" on public.businesses
for select to authenticated using (private.user_can_manage(id));

create policy "managers read products" on public.products
for select to authenticated using (private.user_can_manage(business_id));

create policy "managers read categories" on public.categories
for select to authenticated using (private.user_can_manage(business_id));

revoke all on table public.businesses, public.business_members, public.products, public.categories from anon, authenticated;
grant select, update on table public.businesses to authenticated;
grant select, update on table public.business_members to authenticated;
grant select, insert, update, delete on table public.products, public.categories to authenticated;

create or replace function public.get_public_store(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  store public.businesses%rowtype;
  result jsonb;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' then
    return null;
  end if;

  select * into store
  from public.businesses b
  where b.slug = p_slug and b.published
  limit 1;

  if store.id is null then return null; end if;

  select jsonb_build_object(
    'business', jsonb_build_object(
      'id',store.id,'slug',store.slug,'name',store.name,'whatsapp',store.whatsapp,
      'instagram',store.instagram,'tiktok',store.tiktok,'address',store.address,
      'hero_image_url',store.hero_image_url,'logo_url',store.logo_url,
      'primary_color',store.primary_color,'published',store.published,
      'customization',store.customization
    ),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',p.id,'name',p.name,'category',p.category,'description',p.description,
        'price',p.price,'old_price',p.old_price,'sizes',p.sizes,'colors',p.colors,
        'image_url',p.image_url,'images',p.images,'stock',p.stock,
        'availability',p.availability,'variant_options',p.variant_options,
        'sort_order',p.sort_order,'created_at',p.created_at
      ) order by p.sort_order,p.created_at desc)
      from public.products p
      where p.business_id=store.id and p.active
        and coalesce(p.variant_options->>'publication','published') <> 'draft'
        and case
          when p.variant_options->>'publication'='scheduled'
            then nullif(p.variant_options->>'publish_at','')::timestamptz <= now()
          else true
        end
    ),'[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'icon',c.icon,'sort_order',c.sort_order) order by c.sort_order,c.created_at)
      from public.categories c where c.business_id=store.id and c.active
    ),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.get_public_store(text) from public;
grant execute on function public.get_public_store(text) to anon, authenticated;

create or replace function public.reorder_catalog_items(p_business_id uuid,p_kind text,p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare expected_count integer;
begin
  if not private.user_can_manage(p_business_id) then raise exception 'Acceso denegado' using errcode='42501'; end if;
  if p_kind not in ('product','category') then raise exception 'Tipo de catálogo inválido'; end if;
  if coalesce(cardinality(p_ids),0)=0 then return; end if;
  if (select count(distinct value) from unnest(p_ids) value) <> cardinality(p_ids) then raise exception 'La lista contiene elementos repetidos'; end if;
  if p_kind='product' then
    select count(*) into expected_count from public.products where business_id=p_business_id and id=any(p_ids);
    if expected_count<>cardinality(p_ids) then raise exception 'Uno o más productos no pertenecen a la tienda'; end if;
    update public.products p set sort_order=ordered.position-1,updated_at=now()
    from unnest(p_ids) with ordinality ordered(id,position)
    where p.id=ordered.id and p.business_id=p_business_id;
  else
    select count(*) into expected_count from public.categories where business_id=p_business_id and id=any(p_ids);
    if expected_count<>cardinality(p_ids) then raise exception 'Una o más categorías no pertenecen a la tienda'; end if;
    update public.categories c set sort_order=ordered.position-1
    from unnest(p_ids) with ordinality ordered(id,position)
    where c.id=ordered.id and c.business_id=p_business_id;
  end if;
end;
$$;

revoke all on function public.reorder_catalog_items(uuid,text,uuid[]) from public, anon;
grant execute on function public.reorder_catalog_items(uuid,text,uuid[]) to authenticated;

create or replace function public.rename_category(p_category_id uuid,p_new_name text,p_new_icon text,p_active boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare target_business uuid; previous_name text;
begin
  if char_length(trim(p_new_name)) not between 1 and 60 then raise exception 'Nombre de categoría inválido'; end if;
  select business_id,name into target_business,previous_name from public.categories where id=p_category_id for update;
  if target_business is null or not private.user_can_manage(target_business) then raise exception 'Acceso denegado' using errcode='42501'; end if;
  update public.categories set name=trim(p_new_name),icon=left(coalesce(nullif(trim(p_new_icon),''),'◇'),12),active=coalesce(p_active,true) where id=p_category_id;
  if previous_name<>trim(p_new_name) then update public.products set category=trim(p_new_name),updated_at=now() where business_id=target_business and category=previous_name; end if;
end;
$$;

revoke all on function public.rename_category(uuid,text,text,boolean) from public, anon;
grant execute on function public.rename_category(uuid,text,text,boolean) to authenticated;

drop policy if exists "public reads product images" on storage.objects;
create policy "members read product image metadata" on storage.objects
for select to authenticated using (
  bucket_id='product-images'
  and exists(select 1 from public.businesses b where b.id::text=(storage.foldername(name))[1] and private.user_can_manage(b.id))
);

alter default privileges for role postgres in schema public revoke select,insert,update,delete,truncate,references,trigger on tables from anon,authenticated;
alter default privileges for role postgres in schema public revoke usage,select,update on sequences from anon,authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public,anon,authenticated;

delete from public.businesses b
where b.slug='bellamujer' and b.name in ('BellaMujer','Bella Mujer')
  and not exists(select 1 from public.products p where p.business_id=b.id);

notify pgrst,'reload schema';
