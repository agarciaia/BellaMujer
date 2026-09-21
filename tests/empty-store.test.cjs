const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const edge=fs.readFileSync(path.join(root,'supabase/functions/create-business-admin/index.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase/migrations/20260921203000_stop_default_category_seeding.sql'),'utf8');
const storefront=fs.readFileSync(path.join(root,'enhancements.js'),'utf8');
const products=fs.readFileSync(path.join(root,'v7.js'),'utf8');

assert.match(edge,/hero_title:\s*""/,'new stores have no inherited hero title');
assert.match(edge,/show_promos:\s*false/,'new stores have no inherited promotional cards');
assert.doesNotMatch(edge,/Faldas|Blusas|Vestidos|Ropa de Iglesia/,'new-store function is business-neutral');
assert.match(migration,/drop trigger if exists seed_categories_after_business/,'category seed trigger is removed');
assert.match(storefront,/hasCategories=cats\.length>1/,'empty category section stays hidden');
assert.match(products,/Primero crea una categoría/,'products require an administrator-created category');
assert.doesNotMatch(products,/p\.category\|\|'Productos'/,'product form does not invent a default category');
console.log('PASS: new stores start without inherited content or categories');
