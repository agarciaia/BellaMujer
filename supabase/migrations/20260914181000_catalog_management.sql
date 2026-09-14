alter table public.products add column if not exists stock integer not null default 0 check (stock >= 0);
alter table public.products add column if not exists images text[] not null default '{}';
alter table public.business_members add column if not exists trial_ends_at timestamptz;
alter table public.business_members add column if not exists last_access_at timestamptz;

create table if not exists public.categories (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 60),
 icon text not null default '✦' check (char_length(icon) between 1 and 12),
 sort_order integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique (business_id,name)
);
create index if not exists categories_business_sort_idx on public.categories(business_id,sort_order);
alter table public.categories enable row level security;
create policy "public reads active categories" on public.categories for select to anon,authenticated using (
 active and exists(select 1 from public.businesses b where b.id=business_id and b.published)
 or private.user_can_manage(business_id)
);
create policy "members create categories" on public.categories for insert to authenticated with check(private.user_can_manage(business_id));
create policy "members update categories" on public.categories for update to authenticated using(private.user_can_manage(business_id)) with check(private.user_can_manage(business_id));
create policy "members delete categories" on public.categories for delete to authenticated using(private.user_can_manage(business_id));
grant select on public.categories to anon;
grant select,insert,update,delete on public.categories to authenticated;

create or replace function private.user_can_manage(target_business uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select (select auth.uid()) is not null and (
  (select auth.uid())='253c6a3c-f4b9-4be6-95f2-0c081789bf04'::uuid
  or exists(select 1 from public.business_members bm where bm.business_id=target_business and bm.user_id=(select auth.uid()) and bm.active and (bm.trial_ends_at is null or bm.trial_ends_at>now()))
 );
$$;
revoke all on function private.user_can_manage(uuid) from public;
grant usage on schema private to anon,authenticated;
grant execute on function private.user_can_manage(uuid) to anon,authenticated;

insert into public.categories(business_id,name,icon,sort_order)
select b.id,x.name,x.icon,x.ord from public.businesses b
cross join (values ('Faldas','◒',1),('Blusas','♢',2),('Vestidos','♚',3),('Cinturones','◉',4),('Ropa de Iglesia','✧',5)) x(name,icon,ord)
where b.slug='bellamujer' on conflict(business_id,name) do nothing;

update public.products set stock=10 where stock=0;
update public.products set images=array[image_url] where cardinality(images)=0 and image_url<>'';

create or replace function public.seed_business_categories() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.categories(business_id,name,icon,sort_order) values
 (new.id,'Faldas','◒',1),(new.id,'Blusas','♢',2),(new.id,'Vestidos','♚',3),(new.id,'Cinturones','◉',4),(new.id,'Ropa de Iglesia','✧',5) on conflict do nothing;
 return new;
end;$$;
revoke all on function public.seed_business_categories() from public,anon,authenticated;
drop trigger if exists seed_categories_after_business on public.businesses;
create trigger seed_categories_after_business after insert on public.businesses for each row execute function public.seed_business_categories();
