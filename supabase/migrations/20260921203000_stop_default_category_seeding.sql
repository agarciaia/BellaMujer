-- New stores start empty. Categories are created explicitly by their administrator.
drop trigger if exists seed_categories_after_business on public.businesses;
drop function if exists public.seed_business_categories();
