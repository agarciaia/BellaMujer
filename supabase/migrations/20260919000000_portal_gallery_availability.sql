alter table public.products
  add column if not exists availability text not null default 'available';

update public.products
set availability = case when stock <= 0 then 'sold_out' else 'available' end
where true;

alter table public.products
  drop constraint if exists products_availability_check;

alter table public.products
  add constraint products_availability_check
  check (availability in ('available','sold_out'));

update public.products
set images = images[1:3]
where cardinality(images) > 3;

alter table public.products
  drop constraint if exists products_max_three_images_check;

alter table public.products
  add constraint products_max_three_images_check
  check (cardinality(images) <= 3);

update public.categories set icon='👗' where icon in ('◒','♚') and name in ('Faldas','Vestidos');
update public.categories set icon='👚' where icon='♢' and name='Blusas';
update public.categories set icon='👜' where icon='◉' and name='Cinturones';
update public.categories set icon='✨' where icon='✧' and name='Ropa de Iglesia';

create or replace function public.seed_business_categories()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
 insert into public.categories(business_id,name,icon,sort_order) values
 (new.id,'Faldas','👗',1),
 (new.id,'Blusas','👚',2),
 (new.id,'Vestidos','👗',3),
 (new.id,'Cinturones','👜',4),
 (new.id,'Ropa de Iglesia','✨',5)
 on conflict do nothing;
 return new;
end;
$$;

revoke all on function public.seed_business_categories() from public,anon,authenticated;

create index if not exists products_business_active_sort_idx
  on public.products(business_id,active,sort_order,created_at desc);
