const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..')+'/';
let html=fs.readFileSync(root+'index.html','utf8');
for(const file of ['admin.js','ux.js','catalog.js','v7.js','enhancements.js'])html=html.replace(`<script src="${file}"></script>`,()=>'<script>'+fs.readFileSync(root+file,'utf8')+'</script>');
const businesses=[{id:'11111111-1111-4111-8111-111111111111',slug:'bellamujer',name:'Bella Mujer',published:true,logo_url:'',hero_image_url:'',created_at:'2026-01-01'},{id:'22222222-2222-4222-8222-222222222222',slug:'moda-cristiana',name:'Moda Cristiana',published:true,logo_url:'',hero_image_url:'',created_at:'2026-01-02'}];
function makeApi(user=null){return {from(table){const q={select(){return q},eq(){return q},order(){return q},maybeSingle:async()=>({data:null}),then(fn){return Promise.resolve({data:table==='businesses'?businesses:[],error:null}).then(fn)}};return q},auth:{onAuthStateChange(){},getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:user?{user}:null}})}}}
async function page(user=null){const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'dangerously',beforeParse(w){w.supabase={createClient:()=>makeApi(user)};w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};}});await new Promise(r=>dom.window.addEventListener('load',r));await new Promise(r=>setTimeout(r,35));return dom}
(async()=>{
 const anonymous=await page();let w=anonymous.window;
 assert.equal(w.document.body.classList.contains('portal-mode'),true);assert.equal(w.document.querySelectorAll('.portal-card').length,0);assert.match(w.document.querySelector('#portalHome').textContent,/portal general no es público/i);assert.doesNotMatch(w.document.querySelector('#portalHome').textContent,/Bella Mujer|Moda Cristiana/);assert.equal(w.document.querySelector('.hero').offsetParent,null);anonymous.window.close();
 const superadmin=await page({id:'253c6a3c-f4b9-4be6-95f2-0c081789bf04',email:'superadmin@admin.bellamujer.invalid',app_metadata:{role:'superadmin'}});w=superadmin.window;
 assert.equal(w.document.querySelectorAll('.portal-card').length,2);assert.match(w.document.querySelector('#portalHome').textContent,/Moda Cristiana/);assert.match(w.document.querySelector('#portalHome').textContent,/Solo tu cuenta puede ver este directorio/);assert.equal(w.document.querySelector('.brand').textContent,'Todas las tiendas');superadmin.window.close();
 console.log('PASS: the public root is private and only the superadministrator sees every store');
})().catch(error=>{console.error(error);process.exitCode=1});
