alter table public.businesses add column customization jsonb not null default '{}'::jsonb check (jsonb_typeof(customization)='object' and octet_length(customization::text)<=30000);
