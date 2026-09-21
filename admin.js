let activeBusiness=null;
let activeUser=null;
let adminProductsCache=[];
const appBaseUrl=location.origin+'/';
let managedBusiness=null;
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const list=value=>String(value||'').split(',').map(x=>x.trim()).filter(Boolean);
const slugFrom=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50);

const adminStyle=document.createElement('style');
adminStyle.textContent=`
.admin-sheet{max-width:760px}.admin-tabs{display:flex;gap:7px;overflow:auto;margin:12px 0 18px;padding-bottom:4px}.admin-tab{white-space:nowrap;border:1px solid var(--line);border-radius:999px;background:#fff;padding:9px 12px;font-weight:850;color:var(--wine)}.admin-tab.active{background:var(--wine);color:#fff}.admin-panel{display:none}.admin-panel.active{display:block}.admin-grid{display:grid;gap:12px}.admin-card{border:1px solid var(--line);border-radius:18px;padding:14px;background:#fff}.admin-card h3{margin:0 0 10px;font-family:Georgia,serif}.field textarea,.field select{width:100%;border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff}.field textarea{min-height:86px;resize:vertical}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px}.admin-list{display:grid;gap:10px}.admin-product{display:grid;grid-template-columns:58px 1fr auto;gap:10px;align-items:center;border:1px solid var(--line);padding:9px;border-radius:15px}.admin-product img{width:58px;height:68px;object-fit:cover;border-radius:10px;background:var(--blush)}.small-actions{display:flex;gap:6px}.small-actions button{border:1px solid var(--line);background:#fff;border-radius:10px;padding:7px}.share-link{word-break:break-all;background:var(--blush);padding:10px;border-radius:12px;font-size:.82rem}.qr-box{display:grid;place-items:center;padding:16px}.danger{color:#a12648}.notice{padding:10px 12px;border-radius:12px;background:#f8f0d9;color:#6d5610;font-size:.84rem}.admin-save{width:100%;margin-top:10px}@media(max-width:520px){.two-col{grid-template-columns:1fr}.admin-product{grid-template-columns:50px 1fr}.admin-product>.small-actions{grid-column:1/-1}.admin-product img{width:50px;height:60px}}
`;
document.head.appendChild(adminStyle);

async function fetchBusiness(slug){
  if(!authReady())return null;
  const {data,error}=await supabaseClient.from('businesses').select('*').eq('slug',slug).maybeSingle();
  if(error){console.error(error);return null}
  return data;
}

const brandFonts={classic:'Georgia, serif',modern:'Arial, sans-serif',rounded:'Trebuchet MS, sans-serif',editorial:'Palatino Linotype, Georgia, serif'};
const colorValue=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
function webUrl(value){if(!value)return '';try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}}
const brandDefaults={kicker:'Moda femenina',hero_title:'Elegancia que se siente tuya',hero_description:'Faldas, blusas, vestidos, cinturones y ropa de iglesia con una experiencia de compra simple y femenina.',hero_badge:'Nueva colección ✨',hero_button:'Ver colección',catalog_title:'Encuentra tu favorito',about:'',hours:'',delivery:'',email:'',phone:'',facebook:'',maps:'',website:'',font:'classic',body_font:'modern',accent:'#9e4763',background:'#fffaf7',text:'#25171d',hero_color:'#4f1428',show_promos:true,promo_titles:['Despacho coordinado','Nuevos ingresos','Guarda favoritos','Compra fácil'],promo_details:['Confirma tu compra por WhatsApp.','Prendas seleccionadas cada semana.','Arma tu selección antes de comprar.','Envía tu carrito completo por WhatsApp.']};
const brandStyle=document.createElement('style');brandStyle.textContent=`body{background:var(--brand-bg,#fffaf7);color:var(--ink);font-family:var(--body-font,Arial,sans-serif)}.shell h1,.shell h2,.shell h3,.category-card strong,.profile-title{font-family:var(--heading-font,Georgia,serif)!important}.topbar,.bottom{background:var(--brand-bg,#fffaf7)}.hero .btn-light{color:var(--wine)}.brand-logo[hidden],.float-tag[hidden]{display:none!important}.brand-logo{max-width:90px;max-height:60px;object-fit:contain;margin-bottom:8px}.brand-contact{display:flex;flex-wrap:wrap;gap:9px}.brand-info{white-space:pre-line;line-height:1.6}.image-preview{height:90px;max-width:180px;object-fit:contain;border:1px solid var(--line);border-radius:12px}.credentials{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit}.field label{display:block}.admin-sheet{scroll-behavior:smooth}`;document.head.appendChild(brandStyle);
function applyBusiness(business){
 if(!business)return;activeBusiness=business;const c={...brandDefaults,...business.customization},style=document.documentElement.style;
 for(const [key,value] of Object.entries({'--wine':colorValue(business.primary_color,'#772640'),'--wine2':colorValue(c.accent,'#9e4763'),'--brand-bg':colorValue(c.background,'#fffaf7'),'--ink':colorValue(c.text,'#25171d'),'--heading-font':brandFonts[c.font]||brandFonts.classic,'--body-font':brandFonts[c.body_font]||brandFonts.modern}))style.setProperty(key,value);
 document.querySelector('.brand').textContent=business.name;document.title=business.name+' — Catálogo';
 const text=(selector,value)=>{document.querySelector(selector).textContent=value};
 text('.brand-kicker',c.kicker);text('.hero-pill','Selección '+business.name);text('.hero h2',c.hero_title);text('.hero p',c.hero_description);text('.float-tag',c.hero_badge);document.querySelector('.float-tag').hidden=!c.hero_badge;text('.hero .btn',c.hero_button);text('#catalogo .heading h2',c.catalog_title);
 let logo=document.querySelector('#brandLogo');if(!logo){logo=document.createElement('img');logo.id='brandLogo';logo.className='brand-logo';document.querySelector('.brand').parentElement.prepend(logo)}logo.alt=business.name;const logoUrl=webUrl(business.logo_url);logo.hidden=!logoUrl;if(logoUrl)logo.src=logoUrl;else logo.removeAttribute('src');
 const hero=document.querySelector('.hero'),cover=webUrl(business.hero_image_url);hero.style.background=cover?`linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.6)),url(${JSON.stringify(cover)}) center/cover`:`linear-gradient(135deg,${colorValue(c.hero_color,'#4f1428')},${colorValue(business.primary_color,'#772640')})`;hero.querySelector('.dress').style.display=cover?'none':'';
 document.querySelector('.promo-row').hidden=c.show_promos===false;document.querySelector('.promo-row').style.display=c.show_promos===false?'none':'';
 document.querySelectorAll('.promo').forEach((el,i)=>{el.querySelector('strong').textContent=c.promo_titles?.[i]??brandDefaults.promo_titles[i];el.querySelector('small').textContent=c.promo_details?.[i]??brandDefaults.promo_details[i]});
 let info=document.querySelector('#storeLinks');if(!info){info=document.createElement('section');info.id='storeLinks';info.className='section';document.querySelector('main').appendChild(info)}info.replaceChildren();
 for(const [label,value] of [['Sobre nosotros',c.about],['Horarios',c.hours],['Entregas y pagos',c.delivery],['Dirección',business.address]]){if(!value)continue;const h=document.createElement('h3'),p=document.createElement('p');h.textContent=label;p.textContent=value;p.className='brand-info';info.append(h,p)}
 const links=document.createElement('div');links.className='brand-contact';info.append(links);
 const phone=String(c.phone||'').replace(/[^+0-9]/g,''),wa=String(business.whatsapp||'').replace(/\D/g,'');
 for(const [label,url] of [['Instagram',webUrl(business.instagram)],['TikTok',webUrl(business.tiktok)],['Facebook',webUrl(c.facebook)],['Cómo llegar',webUrl(c.maps)],['Sitio web',webUrl(c.website)],['WhatsApp',wa?'https://wa.me/'+wa:''],['Llamar',phone?'tel:'+phone:''],['Correo',/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)?'mailto:'+c.email:'']]){if(!url)continue;const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';a.className='btn btn-outline';links.appendChild(a)}
}

async function loadStore(){
  const slug=new URLSearchParams(location.search).get('tienda');
  if(!slug){activeBusiness=null;return}
  const business=await fetchBusiness(slug);
  if(!business){activeBusiness=null;products.splice(0);cats.splice(0,cats.length,'Todas');renderCats();render();document.querySelector('#count').textContent='Tienda no disponible';return}
  applyBusiness(business);
  const {data,error}=await supabaseClient.from('products').select('*').eq('business_id',business.id).eq('active',true).order('sort_order').order('created_at',{ascending:false});
  if(error){console.error(error);return}
  if(data){
    products.splice(0,products.length,...data.map((p,i)=>({
      id:p.id,dbId:p.id,name:p.name,cat:p.category,price:Number(p.price),old:Number(p.old_price||0),
      sizes:p.sizes?.length?p.sizes:['Única'],colors:p.colors?.length?p.colors:['Consultar'],
      img:p.image_url||makeImg(p.name,'#ead2da','#fff7f9'),desc:p.description||''
    })));
    cats.splice(0,cats.length,'Todas',...new Set(products.map(p=>p.cat)));
    if(!cats.includes(selectedCat))selectedCat='Todas';
    cart=cart.filter(x=>products.some(p=>p.id===x.id)).map(x=>{const p=products.find(p=>p.id===x.id);return {...x,name:p.name,price:p.price,img:p.img}});favs=favs.filter(id=>products.some(p=>p.id===id));save();
    renderCats();render();
  }
}

async function resolveBusinessForUser(user){
  if(user.id===SUPERADMIN_USER_ID||user.app_metadata?.role==='superadmin'){
    window.accessExpired=false;
    const selectedSlug=new URLSearchParams(location.search).get('tienda');
    return selectedSlug?await fetchBusiness(selectedSlug):(activeBusiness||null);
  }
  const {data:membership}=await supabaseClient.from('business_members').select('business_id,trial_ends_at').eq('user_id',user.id).eq('active',true).maybeSingle();
  const businessId=membership?.business_id;
  if(!businessId)return null;
  window.accessExpired=Boolean(membership.trial_ends_at&&new Date(membership.trial_ends_at)<=new Date());
  const {data}=await supabaseClient.from('businesses').select('*').eq('id',businessId).maybeSingle();
  return data;
}

accountView=async function(user){
  activeUser=user;
  const isSuperAdmin=user.id===SUPERADMIN_USER_ID||user.app_metadata?.role==='superadmin';
  const displayUser=isSuperAdmin?'superadmin':(user.user_metadata?.username||String(user.email||'').split('@')[0]||'administrador');
  const business=await resolveBusinessForUser(user);
  managedBusiness=business;
  profileContent.innerHTML=`<div class="profile-head"><div class="profile-avatar">${isSuperAdmin?'SA':'AD'}</div><div><span class="admin-badge">${isSuperAdmin?'✦ Superadministrador':'Administrador'}</span><h2 class="profile-title">${isSuperAdmin?'Panel principal':esc(business?.name||'Mi tienda')}</h2></div></div>
  <div class="status-card"><div class="status-row"><span>Usuario</span><strong>${esc(displayUser)}</strong></div><div class="status-row"><span>Estado</span><strong class="status-ok">Activo</strong></div><div class="status-row"><span>Tienda</span><strong>${esc(business?.name||'Sin tienda seleccionada')}</strong></div></div>
  ${business?`<button class="btn btn-wine" style="width:100%;margin-bottom:9px" onclick="openAdminDashboard()">⚙ Administrar tienda</button><button class="btn btn-outline" style="width:100%;margin-bottom:9px" onclick="openPublicStore()">Ver tienda pública</button>`:''}
  ${isSuperAdmin?'<button class="btn btn-outline" style="width:100%;margin-bottom:9px" onclick="openAdminDashboard(\'profiles\')">＋ Crear y administrar perfiles</button>':''}
  <button class="btn btn-outline" style="width:100%" id="logoutButton">Cerrar sesión</button>`;
  document.querySelector('#logoutButton').onclick=logoutProfile;
};

function openPublicStore(){
  if(managedBusiness)location.href=appBaseUrl+'?tienda='+encodeURIComponent(managedBusiness.slug);
}

async function openAdminDashboard(tabName='settings'){
  closeModal('profileModal');adminModal.classList.add('show');
  adminContent.innerHTML='<div class="empty">Cargando, ajustando perfil…</div>';
  const isSuper=activeUser?.id===SUPERADMIN_USER_ID||activeUser?.app_metadata?.role==='superadmin';
  const business=managedBusiness||await resolveBusinessForUser(activeUser);
  managedBusiness=business;
  if(!business&&!isSuper){adminContent.innerHTML='<div class="empty">Tu cuenta no tiene una tienda asignada.</div>';return}
  if(!business&&isSuper){adminContent.innerHTML='<p class="eyebrow">Superadministración</p><h2 class="profile-title">Administración general</h2><div class="admin-tabs"><button class="admin-tab active" data-tab="profiles">Perfiles y tiendas</button></div><section class="admin-panel active" data-panel="profiles"><div class="empty">Cargando tiendas…</div></section>';await renderProfiles();return}
  adminContent.innerHTML=`<p class="eyebrow">Administración</p><h2 class="profile-title">${esc(business.name)}</h2>
  <div class="admin-tabs"><button class="admin-tab" data-tab="settings">Ajustes</button><button class="admin-tab" data-tab="products">Productos</button><button class="admin-tab" data-tab="share">Link y QR</button>${isSuper?'<button class="admin-tab" data-tab="profiles">Perfiles</button>':''}</div>
  <section class="admin-panel" data-panel="settings"></section><section class="admin-panel" data-panel="products"></section><section class="admin-panel" data-panel="share"></section><section class="admin-panel" data-panel="profiles"></section>`;
  adminContent.querySelectorAll('.admin-tab').forEach(btn=>btn.onclick=()=>showAdminTab(btn.dataset.tab));
  renderSettings();await renderProductAdmin();renderShare();if(isSuper)await renderProfiles();showAdminTab(tabName);
}

function showAdminTab(name){
  adminContent.querySelectorAll('.admin-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));
  adminContent.querySelectorAll('.admin-panel').forEach(x=>x.classList.toggle('active',x.dataset.panel===name));
}

function renderSettings(){
 const b=managedBusiness,c={...brandDefaults,...b.customization};
 const field=(name,label,value,type='text',limit=250)=>`<div class="field"><label for="setting-${name}">${label}</label>${type==='textarea'?`<textarea id="setting-${name}" name="${name}" maxlength="${limit}">${esc(value)}</textarea>`:`<input id="setting-${name}" name="${name}" type="${type}" maxlength="${limit}" value="${esc(value)}" ${name==='name'?'required minlength="2"':''}>`}</div>`;
 const select=(name,label,value)=>`<div class="field"><label for="setting-${name}">${label}</label><select id="setting-${name}" name="${name}">${[['classic','Clásica — Georgia'],['modern','Moderna — Arial'],['rounded','Redondeada — Trebuchet'],['editorial','Editorial — Palatino']].map(([key,label])=>`<option value="${key}" ${value===key?'selected':''}>${label}</option>`).join('')}</select></div>`;
 const image=(name,label,url)=>`<div class="field"><label for="${name}File">${label}</label>${url?`<img class="image-preview" src="${esc(webUrl(url))}" alt="${label} actual">`:''}<input id="${name}File" type="file" accept="image/jpeg,image/png,image/webp"><input name="${name}_url" type="hidden" value="${esc(url)}"><label><input type="checkbox" name="remove_${name}"> Quitar imagen actual</label><small>JPG, PNG o WebP. Máximo 5 MB.</small></div>`;
 const card=(title,content)=>`<div class="admin-card"><h3>${title}</h3>${content}</div>`;
 adminContent.querySelector('[data-panel=settings]').innerHTML=`<form id="settingsForm" class="admin-grid">${card('Información del negocio',field('name','Nombre de la empresa',b.name,'text',80)+field('kicker','Rubro o frase breve',c.kicker)+field('about','Sobre nosotros',c.about,'textarea',3000)+field('address','Dirección',b.address)+field('hours','Horarios de atención',c.hours,'textarea',1000)+field('delivery','Entregas, pagos y condiciones de compra',c.delivery,'textarea',2000))}
 ${card('Contacto y redes',field('whatsapp','WhatsApp con código de país',b.whatsapp,'tel')+field('phone','Teléfono',c.phone,'tel')+field('email','Correo de contacto',c.email,'email')+['instagram','tiktok'].map(k=>field(k,k==='instagram'?'Instagram':'TikTok',b[k],'url')).join('')+[['facebook','Facebook'],['maps','Enlace de Google Maps'],['website','Sitio web']].map(([k,l])=>field(k,l,c[k],'url')).join('')+'<small>Enlaces completos que comiencen con https://. Los contactos vacíos no se muestran.</small>')}
 ${card('Logo y portada',image('logo','Logo de la empresa',b.logo_url)+image('hero_image','Foto de portada',b.hero_image_url))}
 ${card('Colores y letras','<div class="two-col">'+field('primary_color','Color principal',b.primary_color||'#772640','color')+[['accent','Color secundario'],['background','Fondo'],['text','Texto'],['hero_color','Fondo de portada']].map(([k,l])=>field(k,l,c[k],'color')).join('')+select('font','Tipografía de títulos',c.font)+select('body_font','Tipografía de textos',c.body_font)+'</div>')}
 ${card('Textos de la tienda',field('hero_title','Título de portada',c.hero_title)+field('hero_description','Descripción de portada',c.hero_description,'textarea',1000)+field('hero_badge','Etiqueta de portada',c.hero_badge)+field('hero_button','Texto del botón de portada',c.hero_button)+field('catalog_title','Título del catálogo',c.catalog_title))}
 ${card('Avisos destacados',`<label><input name="show_promos" type="checkbox" ${c.show_promos?'checked':''}> Mostrar avisos</label>`+Array.from({length:4},(_,i)=>field('promo_title_'+i,'Aviso '+(i+1),c.promo_titles?.[i])+field('promo_detail_'+i,'Detalle '+(i+1),c.promo_details?.[i])).join(''))}
 ${card('Visibilidad',`<label><input name="published" type="checkbox" ${b.published?'checked':''}> Tienda pública activa</label>`)}
 <p class="profile-message" id="settingsMessage" role="status"></p><button class="btn btn-wine admin-save">Guardar ajustes</button><button type="button" class="btn btn-outline" onclick="openPublicStore()">Ver tienda pública</button></form>`;
 document.querySelector('#settingsForm').onsubmit=saveSettings;
 bindImagePreview(document.querySelector('#logoFile'));bindImagePreview(document.querySelector('#hero_imageFile'));
}
async function saveSettings(e){
 e.preventDefault();const form=e.target,f=new FormData(form),message=document.querySelector('#settingsMessage'),get=k=>String(f.get(k)||'').trim();
 const customization={...managedBusiness.customization};
 for(const key of Object.keys(brandDefaults)){if(['promo_titles','promo_details','show_promos'].includes(key))continue;customization[key]=get(key)}
 customization.show_promos=f.get('show_promos')==='on';customization.promo_titles=Array.from({length:4},(_,i)=>get('promo_title_'+i));customization.promo_details=Array.from({length:4},(_,i)=>get('promo_detail_'+i));
 for(const key of ['instagram','tiktok','facebook','maps','website']){if(get(key)&&!webUrl(get(key))){message.textContent='Usa un enlace https:// válido en '+key;return}}
 const wa=get('whatsapp').replace(/\D/g,'');if(wa&&!/^\d{8,15}$/.test(wa)){message.textContent='Escribe el WhatsApp con código de país y entre 8 y 15 dígitos.';return}
 for(const key of ['logo','hero_image']){const file=form.querySelector('#'+key+'File').files[0];if(file){const url=await uploadImage(file);if(!url)return;f.set(key+'_url',url)}else if(f.get('remove_'+key)==='on')f.set(key+'_url','')}
 const payload={name:get('name'),whatsapp:wa,instagram:get('instagram'),tiktok:get('tiktok'),address:get('address'),primary_color:get('primary_color'),logo_url:get('logo_url'),hero_image_url:get('hero_image_url'),customization,published:f.get('published')==='on',updated_at:new Date().toISOString()};
 const {data,error}=await supabaseClient.from('businesses').update(payload).eq('id',managedBusiness.id).select().single();
 message.textContent=error?error.message:'Todos los ajustes se guardaron correctamente.';
 if(data){managedBusiness=data;if(activeBusiness?.id===data.id)applyBusiness(data);message.className='profile-message status-ok';renderShare()}
}

async function uploadImage(file){
  if(!file)return '';if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('Usa JPG, PNG o WebP');return ''}if(file.size>5*1024*1024){toast('La imagen supera 5 MB');return ''}
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
  const path=`${managedBusiness.id}/${crypto.randomUUID()}.${ext}`;
  const {error}=await supabaseClient.storage.from('product-images').upload(path,file,{cacheControl:'3600',upsert:false});
  if(error){toast(error.message);return ''}
  return supabaseClient.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

async function renderProductAdmin(){
  const panel=adminContent.querySelector('[data-panel=products]');
  const {data,error}=await supabaseClient.from('products').select('*').eq('business_id',managedBusiness.id).order('sort_order').order('created_at',{ascending:false});
  adminProductsCache=data||[];
  panel.innerHTML=`<button class="btn btn-wine" style="width:100%;margin-bottom:12px" onclick="productForm()">＋ Subir producto</button><div class="admin-list" id="adminProductList"></div>`;
  if(error){adminProductList.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return}
  adminProductList.innerHTML=adminProductsCache.map((p,i)=>`<div class="admin-product"><img src="${esc(p.image_url||makeImg(p.name,'#ead2da','#fff7f9'))}"><div><strong>${esc(p.name)}</strong><div class="price">${CLP(Number(p.price))}</div><small>${p.active?'Visible':'Oculto'} · ${esc(p.category)}</small></div><div class="small-actions"><button onclick="productForm(adminProductsCache[${i}])">Editar</button><button class="danger" onclick="deleteProduct('${p.id}')">Eliminar</button></div></div>`).join('')||'<div class="empty">Todavía no hay productos.</div>';
}

function productForm(p={}){
  adminContent.querySelector('[data-panel=products]').innerHTML=`<form id="productForm" class="admin-grid"><button type="button" class="btn btn-outline" onclick="renderProductAdmin()">← Volver</button><div class="admin-card"><h3>${p.id?'Editar':'Nuevo'} producto</h3>
  <div class="field"><label>Nombre</label><input name="name" value="${esc(p.name)}" required></div><div class="two-col"><div class="field"><label>Categoría</label><input name="category" value="${esc(p.category||'Productos')}" required></div><div class="field"><label>Precio</label><input name="price" type="number" min="0" value="${esc(p.price||0)}" required></div></div>
  <div class="two-col"><div class="field"><label>Precio anterior</label><input name="old_price" type="number" min="0" value="${esc(p.old_price||0)}"></div><div class="field"><label>Foto</label><input id="productFile" type="file" accept="image/jpeg,image/png,image/webp"></div></div>
  <input name="image_url" type="hidden" value="${esc(p.image_url)}"><div class="field"><label>Descripción</label><textarea name="description">${esc(p.description)}</textarea></div><div class="field"><label>Tallas separadas por coma</label><input name="sizes" value="${esc((p.sizes||[]).join(', '))}"></div><div class="field"><label>Colores separados por coma</label><input name="colors" value="${esc((p.colors||[]).join(', '))}"></div><label style="display:flex;gap:8px"><input name="active" type="checkbox" ${p.active!==false?'checked':''}> Producto visible</label></div><p class="profile-message" id="productMessage"></p><button class="btn btn-wine">Guardar producto</button></form>`;
  
  bindImagePreview(document.querySelector('#productFile'));
  document.querySelector('#productForm').onsubmit=e=>saveProduct(e,p.id);
}

async function saveProduct(e,id){
  e.preventDefault();const f=new FormData(e.target);
  if(productFile.files[0]){const url=await uploadImage(productFile.files[0]);if(!url)return;f.set('image_url',url)}
  const payload={business_id:managedBusiness.id,name:String(f.get('name')).trim(),category:String(f.get('category')).trim(),price:Number(f.get('price')),old_price:Number(f.get('old_price')||0),description:String(f.get('description')).trim(),sizes:list(f.get('sizes')),colors:list(f.get('colors')),image_url:String(f.get('image_url')),active:f.get('active')==='on',updated_at:new Date().toISOString()};
  const query=id?supabaseClient.from('products').update(payload).eq('id',id):supabaseClient.from('products').insert(payload);
  const {error}=await query;if(error){productMessage.textContent=error.message;return}toast('Producto guardado');await renderProductAdmin();await loadStore();
}

async function deleteProduct(id){
  if(!confirm('¿Eliminar este producto?'))return;
  const {error}=await supabaseClient.from('products').delete().eq('id',id);
  if(error)return toast(error.message);await renderProductAdmin();await loadStore();
}

function renderShare(){
  const link=appBaseUrl+'?tienda='+encodeURIComponent(managedBusiness.slug);
  const panel=adminContent.querySelector('[data-panel=share]');
  panel.innerHTML=`<div class="admin-card"><h3>Enlace exclusivo</h3><p class="share-link">${esc(link)}</p><button class="btn btn-wine" onclick="navigator.clipboard.writeText('${esc(link)}').then(()=>toast('Link copiado'))">Copiar link</button><div id="businessQr" class="qr-box"></div><p style="color:var(--muted);font-size:.84rem">Este QR abre directamente el catálogo de ${esc(managedBusiness.name)}.</p></div>`;
  if(window.QRCode)new QRCode(document.querySelector('#businessQr'),{text:link,width:220,height:220,colorDark:'#25171d',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
}

async function renderProfiles(){
  const panel=adminContent.querySelector('[data-panel=profiles]');
  const {data}=await supabaseClient.from('business_members').select('user_id,username,role,active,trial_ends_at,business_id,businesses(name,slug)').order('created_at',{ascending:false});
  window.profileMembers=data||[];
  panel.innerHTML=`<form id="createProfileForm" class="admin-grid"><div class="admin-card"><h3>Crear perfil de cliente</h3><div class="field"><label>Nombre del negocio</label><input name="businessName" required></div><div class="field"><label>Usuario</label><input name="username" pattern="[a-zA-Z0-9._-]{3,30}" required></div><div class="field"><label>Contraseña</label><input name="password" type="password" minlength="6" required></div><div class="field"><label>Nombre del enlace</label><input name="slug" placeholder="se completa automáticamente"></div></div><p class="profile-message" id="profileCreateMessage"></p><button class="btn btn-wine">Crear perfil y tienda</button></form><h3 style="margin-top:22px">Perfiles creados</h3><div class="admin-list">${(data||[]).map(x=>`<div class="admin-card"><strong>${esc(x.businesses?.name||'Negocio')}</strong><div>Usuario: ${esc(x.username)}</div><small>${x.active?'Activo':'Suspendido'} · /${esc(x.businesses?.slug||'')}</small><div class="small-actions"><button onclick="manageBusiness('${x.business_id}')">Administrar tienda</button>${x.user_id!==SUPERADMIN_USER_ID?`<button onclick="toggleMember('${x.user_id}','${x.business_id}',${!x.active})">${x.active?'Suspender acceso':'Activar acceso'}</button>`:''}</div></div>`).join('')}</div>`;
  document.querySelector('#createProfileForm').onsubmit=createProfile;
  const businessName=document.querySelector('#createProfileForm [name=businessName]'),slug=document.querySelector('#createProfileForm [name=slug]');
  businessName.oninput=()=>{if(!slug.dataset.edited)slug.value=slugFrom(businessName.value)};slug.oninput=()=>slug.dataset.edited='1';
}

async function createProfile(e){
  e.preventDefault();const f=new FormData(e.target),message=document.querySelector('#profileCreateMessage');
  const {data,error}=await supabaseClient.functions.invoke('create-business-admin',{body:{businessName:f.get('businessName'),username:f.get('username'),password:f.get('password'),slug:f.get('slug')}});
  if(error||data?.error){let detail=data?.error;try{if(!detail&&error?.context)detail=(await error.context.json()).error}catch{}message.textContent=detail||error.message;return}
  const link=appBaseUrl+'?tienda='+data.business.slug;
  const credentials='Negocio: '+data.business.name+'\nEnlace: '+link+'\nUsuario: '+data.user.username+'\nContraseña: '+String(f.get('password'))+'\nIngresa en Perfil para administrar tu tienda.';
  await renderProfiles();
  const result=document.createElement('div');result.className='admin-card';
  const info=document.createElement('p');info.textContent='Perfil creado: '+data.user.username+'. Copia el acceso para entregárselo al administrador. La contraseña no se podrá consultar después.';
  const button=document.createElement('button');button.type='button';button.className='btn btn-wine';button.textContent='Copiar usuario, contraseña y enlace';button.onclick=async()=>{try{await navigator.clipboard.writeText(credentials);toast('Acceso copiado')}catch{const area=document.createElement('textarea');area.readOnly=true;area.value=credentials;area.className='credentials';result.appendChild(area);area.select()}};
  result.append(info,button);adminContent.querySelector('[data-panel=profiles]').prepend(result);
}

directWhatsapp=function(){
  const size=[...productDetail.querySelectorAll('.chips')][0].querySelector('.selected')?.textContent||'',color=[...productDetail.querySelectorAll('.chips')][1].querySelector('.selected')?.textContent||'';
  const number=(activeBusiness?.whatsapp||'').replace(/\D/g,'');if(!number)return toast('El negocio aún no configuró WhatsApp');
  window.open('https://wa.me/'+number+'?text='+encodeURIComponent(`Hola, quiero consultar por ${current.name} | Talla: ${size} | Color: ${color} | ${CLP(current.price)}`),'_blank');
};
orderWhatsapp=function(){
  if(!cart.length)return toast('Tu carrito está vacío');const number=(activeBusiness?.whatsapp||'').replace(/\D/g,'');if(!number)return toast('El negocio aún no configuró WhatsApp');
  const text='Hola, quiero realizar este pedido en '+(activeBusiness?.name||'la tienda')+':\n\n'+cart.map(x=>`• ${x.name} | ${x.size} | ${x.color} | x${x.qty} | ${CLP(x.price*x.qty)}`).join('\n')+'\n\nTotal: '+CLP(cart.reduce((s,x)=>s+x.price*x.qty,0));
  window.open('https://wa.me/'+number+'?text='+encodeURIComponent(text),'_blank');
};

window.addEventListener('load',()=>loadStore());

async function manageBusiness(id){
  const {data,error}=await supabaseClient.from('businesses').select('*').eq('id',id).single();
  if(error)return toast(error.message);
  managedBusiness=data;await openAdminDashboard();
}
async function toggleMember(userId,businessId,active){
  const {error}=await supabaseClient.from('business_members').update({active}).eq('user_id',userId).eq('business_id',businessId);
  if(error)return toast(error.message);
  toast(active?'Acceso activado':'Acceso suspendido');await renderProfiles();
}
const originalLogout=logoutProfile;
logoutProfile=async function(){await originalLogout();activeUser=null;managedBusiness=null;closeModal('adminModal');await loadStore()};
function guardedSubmit(action){return async function(event,...args){event.preventDefault();const form=event.currentTarget||event.target;if(form.dataset.busy)return;form.dataset.busy='1';const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{await action(event,...args)}catch(error){toast('No se pudo guardar. Revisa la conexión e intenta nuevamente.');console.error(error)}finally{delete form.dataset.busy;buttons.forEach(b=>b.disabled=false)}}}
saveSettings=guardedSubmit(saveSettings);saveProduct=guardedSubmit(saveProduct);createProfile=guardedSubmit(createProfile);

function bindImagePreview(input){
 if(!input)return;
 const preview=document.createElement('img');preview.className='image-preview';preview.alt='Vista previa de la imagen seleccionada';preview.style.display='none';
 const status=document.createElement('p');status.className='profile-message';status.setAttribute('role','status');input.after(preview,status);
 input.addEventListener('change',()=>{
  const file=input.files[0];preview.style.display='none';status.textContent='';
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){status.textContent='Usa una imagen JPG, PNG o WebP de hasta 5 MB.';input.value='';return}
  const reader=new FileReader();reader.onload=()=>{preview.src=String(reader.result);preview.style.display='block';status.textContent='Imagen seleccionada. Pulsa Guardar para publicarla.'};reader.onerror=()=>{status.textContent='No se pudo leer esta imagen. Selecciona otra.'};reader.readAsDataURL(file);
 });
}
