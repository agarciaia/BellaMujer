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

function applyBusiness(business){
  if(!business)return;
  activeBusiness=business;
  document.documentElement.style.setProperty('--wine',business.primary_color||'#772640');
  document.querySelector('.brand').textContent=business.name;
  document.title=business.name+' — Catálogo';
  document.querySelector('.hero-pill').textContent='Selección '+business.name;
  let links=document.querySelector('#storeLinks');if(!links){links=document.createElement('section');links.id='storeLinks';links.className='section';document.querySelector('main').appendChild(links)}
  links.replaceChildren();
  for(const [label,url] of [['Instagram',business.instagram],['TikTok',business.tiktok],['WhatsApp',business.whatsapp?'https://wa.me/'+business.whatsapp:'']]){if(!/^https:\/\//i.test(url||''))continue;const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';a.className='btn btn-outline';links.appendChild(a)}
  const address=document.createElement('p');address.textContent=business.address||'';links.appendChild(address);
  const hero=document.querySelector('.hero');
  if(business.hero_image_url){
    hero.style.background=`linear-gradient(rgba(42,10,22,.35),rgba(42,10,22,.55)),url("${business.hero_image_url}") center/cover`;
    hero.querySelector('.dress').style.display='none';
  }
}

async function loadStore(){
  const slug=new URLSearchParams(location.search).get('tienda')||'bellamujer';
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
  if(user.id===SUPERADMIN_USER_ID){
    return await fetchBusiness('bellamujer');
  }
  const {data:membership}=await supabaseClient.from('business_members').select('business_id').eq('user_id',user.id).eq('active',true).maybeSingle();
  const businessId=membership?.business_id;
  if(!businessId)return null;
  const {data}=await supabaseClient.from('businesses').select('*').eq('id',businessId).maybeSingle();
  return data;
}

accountView=async function(user){
  activeUser=user;
  const isSuperAdmin=user.id===SUPERADMIN_USER_ID||user.app_metadata?.role==='superadmin';
  const business=await resolveBusinessForUser(user);
  managedBusiness=business;
  profileContent.innerHTML=`<div class="profile-head"><div class="profile-avatar">${isSuperAdmin?'SA':'AD'}</div><div><span class="admin-badge">${isSuperAdmin?'✦ Superadministrador':'Administrador'}</span><h2 class="profile-title">${isSuperAdmin?'Panel principal':esc(business?.name||'Mi tienda')}</h2></div></div>
  <div class="status-card"><div class="status-row"><span>Usuario</span><strong>${esc(user.user_metadata?.username||user.email)}</strong></div><div class="status-row"><span>Estado</span><strong class="status-ok">Activo</strong></div><div class="status-row"><span>Tienda</span><strong>${esc(business?.name||'Sin asignar')}</strong></div></div>
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
  adminContent.innerHTML='<div class="empty">Cargando administración...</div>';
  const isSuper=activeUser?.id===SUPERADMIN_USER_ID;
  const business=managedBusiness||await resolveBusinessForUser(activeUser);
  managedBusiness=business;
  if(!business&&!isSuper){adminContent.innerHTML='<div class="empty">Tu cuenta no tiene una tienda asignada.</div>';return}
  adminContent.innerHTML=`<p class="eyebrow">Administración</p><h2 class="profile-title">${esc(business?.name||'BellaMujer')}</h2>
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
  const b=managedBusiness;
  adminContent.querySelector('[data-panel=settings]').innerHTML=`<form id="settingsForm" class="admin-grid">
  <div class="admin-card"><h3>Información del negocio</h3><div class="field"><label>Nombre</label><input name="name" value="${esc(b.name)}" required></div>
  <div class="field"><label>WhatsApp con código de país</label><input name="whatsapp" value="${esc(b.whatsapp)}" placeholder="56912345678"></div>
  <div class="field"><label>Instagram</label><input name="instagram" value="${esc(b.instagram)}" placeholder="https://instagram.com/..."></div>
  <div class="field"><label>TikTok</label><input name="tiktok" value="${esc(b.tiktok)}"></div><div class="field"><label>Dirección</label><input name="address" value="${esc(b.address)}"></div></div>
  <div class="admin-card"><h3>Diseño</h3><div class="two-col"><div class="field"><label>Color principal</label><input name="primary_color" type="color" value="${esc(b.primary_color||'#772640')}"></div><div class="field"><label>Portada</label><input id="heroFile" type="file" accept="image/jpeg,image/png,image/webp"></div></div><input name="hero_image_url" type="hidden" value="${esc(b.hero_image_url)}"><label style="display:flex;gap:8px;margin-top:12px"><input name="published" type="checkbox" ${b.published?'checked':''}> Tienda pública activa</label></div>
  <p class="profile-message" id="settingsMessage"></p><button class="btn btn-wine admin-save">Guardar ajustes</button></form>`;
  
  document.querySelector('#settingsForm').onsubmit=saveSettings;
}

async function saveSettings(e){
  e.preventDefault();const f=new FormData(e.target),message=document.querySelector('#settingsMessage');
  if(heroFile.files[0]){const url=await uploadImage(heroFile.files[0]);if(!url)return;f.set('hero_image_url',url)}
  const payload={name:String(f.get('name')).trim(),whatsapp:String(f.get('whatsapp')).replace(/\D/g,''),instagram:String(f.get('instagram')).trim(),tiktok:String(f.get('tiktok')).trim(),address:String(f.get('address')).trim(),primary_color:String(f.get('primary_color')),hero_image_url:String(f.get('hero_image_url')),published:f.get('published')==='on',updated_at:new Date().toISOString()};
  const {data,error}=await supabaseClient.from('businesses').update(payload).eq('id',managedBusiness.id).select().single();
  message.textContent=error?error.message:'Cambios guardados correctamente.';
  if(data){managedBusiness=data;if(activeBusiness?.id===data.id)applyBusiness(data);message.className='profile-message status-ok'}
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
  const {data,error}=await supabaseClient.from('products').select('*').eq('business_id',managedBusiness.id).order('created_at',{ascending:false});
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
  const {data}=await supabaseClient.from('business_members').select('user_id,username,role,active,business_id,businesses(name,slug)').order('created_at',{ascending:false});
  panel.innerHTML=`<form id="createProfileForm" class="admin-grid"><div class="admin-card"><h3>Crear perfil de cliente</h3><div class="field"><label>Nombre del negocio</label><input name="businessName" required></div><div class="field"><label>Usuario</label><input name="username" pattern="[a-zA-Z0-9._-]{3,30}" required></div><div class="field"><label>Contraseña</label><input name="password" type="password" minlength="6" required></div><div class="field"><label>Nombre del enlace</label><input name="slug" placeholder="se completa automáticamente"></div></div><p class="profile-message" id="profileCreateMessage"></p><button class="btn btn-wine">Crear perfil y tienda</button></form><h3 style="margin-top:22px">Perfiles creados</h3><div class="admin-list">${(data||[]).map(x=>`<div class="admin-card"><strong>${esc(x.businesses?.name||'Negocio')}</strong><div>Usuario: ${esc(x.username)}</div><small>${x.active?'Activo':'Suspendido'} · /${esc(x.businesses?.slug||'')}</small><div class="small-actions"><button onclick="manageBusiness('${x.business_id}')">Administrar tienda</button>${x.user_id!==SUPERADMIN_USER_ID?`<button onclick="toggleMember('${x.user_id}','${x.business_id}',${!x.active})">${x.active?'Suspender acceso':'Activar acceso'}</button>`:''}</div></div>`).join('')}</div>`;
  document.querySelector('#createProfileForm').onsubmit=createProfile;
  const businessName=document.querySelector('#createProfileForm [name=businessName]'),slug=document.querySelector('#createProfileForm [name=slug]');
  businessName.oninput=()=>{if(!slug.dataset.edited)slug.value=slugFrom(businessName.value)};slug.oninput=()=>slug.dataset.edited='1';
}

async function createProfile(e){
  e.preventDefault();const f=new FormData(e.target),message=document.querySelector('#profileCreateMessage');
  const {data,error}=await supabaseClient.functions.invoke('create-business-admin',{body:{businessName:f.get('businessName'),username:f.get('username'),password:f.get('password'),slug:f.get('slug')}});
  if(error||data?.error){message.textContent=data?.error||error.message;return}
  const link=appBaseUrl+'?tienda='+data.business.slug;
  message.className='profile-message status-ok';message.innerHTML='Perfil creado. Usuario: <strong>'+esc(data.user.username)+'</strong><br>Link: '+esc(link);
  e.target.reset();
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

window.addEventListener('load',loadStore);

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
