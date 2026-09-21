const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const edge=fs.readFileSync(path.join(root,'supabase/functions/create-business-admin/index.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase/migrations/20260921203000_stop_default_category_seeding.sql'),'utf8');
const storefront=fs.readFileSync(path.join(root,'enhancements.js'),'utf8');
const products=fs.readFileSync(path.join(root,'v7.js'),'utf8');

assert.match(edge,/hero_title:\s*""/,'the generic template keeps the title available for the business name');
assert.match(edge,/hero_title:\s*businessName/,'new stores use their own name as the hero title');
assert.match(edge,/Aquí cuenta qué vendes/,'new stores include editable guidance');
assert.match(edge,/show_promos:\s*true/,'new stores show generic editable guidance cards');
assert.doesNotMatch(edge,/Faldas|Blusas|Vestidos|Ropa de Iglesia/,'new-store function is business-neutral');
assert.match(migration,/drop trigger if exists seed_categories_after_business/,'category seed trigger is removed');
assert.match(storefront,/hasCategories=cats\.length>1/,'empty category section stays hidden');
assert.match(storefront,/bmApplyAccessibleTheme/,'store theme enforces accessible contrast');
assert.match(storefront,/bmContrast\(candidate,background\)>=4\.5/,'configured text falls back when contrast is insufficient');
assert.match(products,/Primero crea una categoría/,'products require an administrator-created category');
assert.doesNotMatch(products,/p\.category\|\|'Productos'/,'product form does not invent a default category');
console.log('PASS: new stores start guided, independent and without inherited categories');
