-- Phase 1: add the safe storefront and atomic admin RPCs before the frontend switches to them.

create or replace function public.get_public_store(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare store public.businesses%rowtype; result jsonb;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' then return null; end if;
  select * into store from public.businesses b where b.slug=p_slug and b.published limit 1;
  if store.id is null then return null; end if;
  select jsonb_build_object(
    'business',jsonb_build_object('id',store.id,'slug',store.slug,'name',store.name,'whatsapp',store.whatsapp,'instagram',store.instagram,'tiktok',store.tiktok,'address',store.address,'hero_image_url',store.hero_image_url,'logo_url',store.logo_url,'primary_color',store.primary_color,'published',store.published,'customization',store.customization),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'category',p.category,'description',p.description,'price',p.price,'old_price',p.old_price,'sizes',p.sizes,'colors',p.colors,'image_url',p.image_url,'images',p.images,'stock',p.stock,'availability',p.availability,'variant_options',p.variant_options,'sort_order',p.sort_order,'created_at',p.created_at) order by p.sort_order,p.created_at desc) from public.products p where p.business_id=store.id and p.active and coalesce(p.variant_options->>'publication','published')<>'draft' and case when p.variant_options->>'publication'='scheduled' then nullif(p.variant_options->>'publish_at','')::timestamptz<=now() else true end),'[]'::jsonb),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'icon',c.icon,'sort_order',c.sort_order) order by c.sort_order,c.created_at) from public.categories c where c.business_id=store.id and c.active),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_public_store(text) from public;
grant execute on function public.get_public_store(text) to anon,authenticated;

create or replace function public.reorder_catalog_items(p_business_id uuid,p_kind text,p_ids uuid[])
returns void language plpgsql security invoker set search_path='' as $$
declare expected_count integer;
begin
  if not private.user_can_manage(p_business_id) then raise exception 'Acceso denegado' using errcode='42501'; end if;
  if p_kind not in ('product','category') then raise exception 'Tipo de catálogo inválido'; end if;
  if coalesce(cardinality(p_ids),0)=0 then return; end if;
  if (select count(distinct value) from unnest(p_ids) value)<>cardinality(p_ids) then raise exception 'La lista contiene elementos repetidos'; end if;
  if p_kind='product' then
    select count(*) into expected_count from public.products where business_id=p_business_id and id=any(p_ids);
    if expected_count<>cardinality(p_ids) then raise exception 'Uno o más productos no pertenecen a la tienda'; end if;
    update public.products p set sort_order=ordered.position-1,updated_at=now() from unnest(p_ids) with ordinality ordered(id,position) where p.id=ordered.id and p.business_id=p_business_id;
  else
    select count(*) into expected_count from public.categories where business_id=p_business_id and id=any(p_ids);
    if expected_count<>cardinality(p_ids) then raise exception 'Una o más categorías no pertenecen a la tienda'; end if;
    update public.categories c set sort_order=ordered.position-1 from unnest(p_ids) with ordinality ordered(id,position) where c.id=ordered.id and c.business_id=p_business_id;
  end if;
end;
$$;
revoke all on function public.reorder_catalog_items(uuid,text,uuid[]) from public,anon;
grant execute on function public.reorder_catalog_items(uuid,text,uuid[]) to authenticated;

create or replace function public.rename_category(p_category_id uuid,p_new_name text,p_new_icon text,p_active boolean)
returns void language plpgsql security invoker set search_path='' as $$
declare target_business uuid; previous_name text;
begin
  if char_length(trim(p_new_name)) not between 1 and 60 then raise exception 'Nombre de categoría inválido'; end if;
  select business_id,name into target_business,previous_name from public.categories where id=p_category_id for update;
  if target_business is null or not private.user_can_manage(target_business) then raise exception 'Acceso denegado' using errcode='42501'; end if;
  update public.categories set name=trim(p_new_name),icon=left(coalesce(nullif(trim(p_new_icon),''),'◇'),12),active=coalesce(p_active,true) where id=p_category_id;
  if previous_name<>trim(p_new_name) then update public.products set category=trim(p_new_name),updated_at=now() where business_id=target_business and category=previous_name; end if;
end;
$$;
revoke all on function public.rename_category(uuid,text,text,boolean) from public,anon;
grant execute on function public.rename_category(uuid,text,text,boolean) to authenticated;

notify pgrst,'reload schema';
