update public.categories
set icon = case
  when lower(name) like '%falda%' then '👗'
  when lower(name) like '%blusa%' or lower(name) like '%polera%' then '👚'
  when lower(name) like '%vestido%' then '👗'
  when lower(name) like '%cintur%' then '👜'
  when lower(name) like '%iglesia%' then '✨'
  when lower(name) like '%chaqueta%' or lower(name) like '%abrigo%' then '🧥'
  when lower(name) like '%zapato%' or lower(name) like '%calzado%' then '👠'
  when lower(name) like '%pañuelo%' then '🧣'
  when lower(name) like '%billetera%' then '👛'
  when lower(name) like '%cartera%' or lower(name) like '%bolso%' or lower(name) like '%accesor%' then '👜'
  else icon
end
where icon in ('◇','◒','♢','♚','◉','✧','✦');
