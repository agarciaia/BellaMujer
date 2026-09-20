alter table public.products
  add column if not exists variant_options jsonb not null
  default '{"image_colors":[],"combinations":[]}'::jsonb;

alter table public.products
  drop constraint if exists products_variant_options_check;

alter table public.products
  add constraint products_variant_options_check check (
    jsonb_typeof(variant_options) = 'object'
    and jsonb_typeof(coalesce(variant_options -> 'image_colors', '[]'::jsonb)) = 'array'
    and jsonb_typeof(coalesce(variant_options -> 'combinations', '[]'::jsonb)) = 'array'
    and octet_length(variant_options::text) <= 30000
  );

comment on column public.products.variant_options is
  'Maps product photos to colors and stores availability for each color/size combination.';
