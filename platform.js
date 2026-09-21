/* Tienda AG: secure public data path, resilient PWA behavior and final UX safeguards. */
const PLATFORM_CONFIG=window.TIENDA_AG_CONFIG||{name:'Tienda AG',shortName:'AG',storagePrefix:'tienda_ag',cacheVersion:'v1'};

function publicStoreCacheKey(slug){return `${PLATFORM_CONFIG.storagePrefix}_public_${PLATFORM_CONFIG.cacheVersion}_${slug}`}
function readPublicStoreCache(slug){try{const value=JSON.parse(localStorage.getItem(publicStoreCacheKey(slug))||'null');return value&&value.business?.slug===slug?value:null}catch{return null}}
function writePublicStoreCache(slug,value){try{localStorage.setItem(publicStoreCacheKey(slug),JSON.stringify(value))}catch{}}
function showOfflineNotice(show){let notice=document.querySelector('#offlineNotice');if(!notice){notice=document.createElement('div');notice.id='offlineNotice';notice.className='offline-notice';notice.setAttribute('role','status');notice.textContent='Sin conexión · mostrando la última versión guardada';document.body.append(notice)}notice.hidden=!show}
function showUnavailableStore(){activeBusiness=null;products.splice(0);cats.splice(0,cats.length,'Todas');renderCats();render();document.querySelector('.brand-kicker').textContent='Enlace no disponible';document.querySelector('.brand').textContent='Tienda no disponible';document.querySelector('.hero-pill').textContent='Sin perfil asociado';document.querySelector('.hero h2').textContent='No encontramos esta tienda';document.querySelector('.hero p').textContent='Revisa el enlace o solicita al administrador el acceso correcto.';count.textContent='Tienda no disponible';finishAppLoading()}
function hydratePublicStore(bundle){
  const business=bundle.business,categoryRows=Array.isArray(bundle.categories)?bundle.categories:[],productRows=Array.isArray(bundle.products)?bundle.products:[];
  applyBusiness(business);
  products.splice(0,products.length,...productRows.map(p=>{const images=(p.images?.length?p.images:[p.image_url]).filter(Boolean).slice(0,3),variant_options=variantOptionsOf(p),base={id:p.id,dbId:p.id,name:p.name,cat:p.category,price:Number(p.price),old:Number(p.old_price||0),sizes:p.sizes?.length?p.sizes:['Única'],colors:p.colors?.length?p.colors:['Consultar'],img:images[0]||makeImg(p.name,'#ead2da','#fff7f9'),images,desc:p.description||'',availability:p.availability||(Number(p.stock||0)>0?'available':'sold_out'),variant_options,created_at:p.created_at||'',sort_order:Number(p.sort_order||0)};base.availability=productHasAvailability(base)?'available':'sold_out';return base}));
  const names=categoryRows.map(c=>c.name),extras=products.map(p=>p.cat).filter(name=>!names.includes(name));cats.splice(0,cats.length,'Todas',...names,...new Set(extras));window.categoryIcons=Object.fromEntries(categoryRows.map(c=>[c.name,iconForCategory(c.name,c.icon)]));
  if(!cats.includes(selectedCat))selectedCat='Todas';cart=cart.filter(item=>{const product=products.find(p=>p.id===item.id);return product&&combinationAvailable(product,item.color,item.size)});favs=favs.filter(id=>products.some(product=>product.id===id));save();renderCats();ensureCatalogControls();render();renderRecentlyViewed();applyHomeSections(business);
  const productId=new URLSearchParams(location.search).get('producto');if(productId&&products.some(p=>String(p.id)===productId)&&!productModal.classList.contains('show'))openProduct(productId,{fromUrl:true});
}

loadStore=async function(){
  showAppLoading('Cargando, ajustando perfil…');showOfflineNotice(false);
  if(isPortalHome()){await renderBusinessPortal();return}
  document.body.classList.remove('portal-mode');document.querySelector('#portalHome')?.remove();
  const slug=new URLSearchParams(location.search).get('tienda'),user=authReady()?await authenticatedUser():null;
  if(user&&!isSuperUser(user)){const assigned=await resolveBusinessForUser(user);if(assigned&&assigned.slug!==slug){location.replace(appBaseUrl+'?tienda='+encodeURIComponent(assigned.slug));return}}
  const result=await supabaseClient.rpc('get_public_store',{p_slug:slug});let bundle=result.data;
  if(result.error){bundle=readPublicStoreCache(slug);if(bundle)showOfflineNotice(true);else{console.error(result.error);toast('No se pudo cargar la tienda. Revisa tu conexión.');finishAppLoading();return}}
  if(!bundle?.business){showUnavailableStore();return}
  if(!result.error)writePublicStoreCache(slug,bundle);hydratePublicStore(bundle);
};

async function saveCatalogOrder(kind,rows){
  const {error}=await supabaseClient.rpc('reorder_catalog_items',{p_business_id:managedBusiness.id,p_kind:kind,p_ids:rows.map(row=>row.id)});
  if(error)throw error;
}
enhanceAdminDrag=function(listElement,kind){
  if(!listElement)return;const selector=kind==='product'?'.admin-product':'.category-row',rows=[...listElement.querySelectorAll(selector)];
  rows.forEach((row,index)=>{row.draggable=true;row.dataset.dragIndex=index;row.ondragstart=()=>row.classList.add('dragging');row.ondragend=()=>row.classList.remove('dragging');row.ondragover=event=>{event.preventDefault();row.classList.add('drag-over')};row.ondragleave=()=>row.classList.remove('drag-over');row.ondrop=async event=>{event.preventDefault();row.classList.remove('drag-over');const from=Number(listElement.querySelector('.dragging')?.dataset.dragIndex),to=Number(row.dataset.dragIndex);if(!Number.isInteger(from)||from===to)return;const data=kind==='product'?adminProductsCache:adminCategories,item=data.splice(from,1)[0];data.splice(to,0,item);try{await saveCatalogOrder(kind,data);toast('Orden actualizado')}catch(error){toast('No se pudo guardar el orden');console.error(error)}kind==='product'?await renderProductAdmin():await renderCategoryAdmin();await loadStore()}});
};
moveProduct=async function(index,direction){const other=index+direction;if(other<0||other>=adminProductsCache.length)return;const next=[...adminProductsCache],[item]=next.splice(index,1);next.splice(other,0,item);try{await saveCatalogOrder('product',next);toast('Orden actualizado')}catch(error){toast('No se pudo guardar el orden');console.error(error)}await renderProductAdmin();await loadStore()};
moveCategory=async function(index,direction){const other=index+direction;if(other<0||other>=adminCategories.length)return;const next=[...adminCategories],[item]=next.splice(index,1);next.splice(other,0,item);try{await saveCatalogOrder('category',next);toast('Orden actualizado')}catch(error){toast('No se pudo guardar el orden');console.error(error)}await renderCategoryAdmin();await loadStore()};
saveCategory=async function(index){const card=adminContent.querySelectorAll('.category-row')[index],category=adminCategories[index],inputs=card.querySelectorAll('input'),name=inputs[1].value.trim();const {error}=await supabaseClient.rpc('rename_category',{p_category_id:category.id,p_new_name:name,p_new_icon:inputs[0].value.trim()||'◇',p_active:inputs[2].checked});if(error)return toast(error.message);toast('Categoría guardada');await renderCategoryAdmin();await loadStore()};

const platformRenderProfiles=renderProfiles;
renderProfiles=async function(){await platformRenderProfiles();document.querySelectorAll('#createProfileForm input[name=password]').forEach(input=>{input.minLength=12;input.setAttribute('autocomplete','new-password');const help=document.createElement('small');help.className='color-help';help.textContent='Mínimo 12 caracteres; combina mayúsculas, minúsculas y números.';input.after(help)})};
resetMemberPassword=async function(userId){const password=prompt('Escribe la nueva contraseña (mínimo 12 caracteres, con mayúscula, minúscula y número)');if(!password)return;if(password.length<12||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/\d/.test(password))return toast('La contraseña no cumple los requisitos de seguridad');const {data,error}=await supabaseClient.functions.invoke('manage-business-admin',{body:{action:'password',userId,password}});if(error||data?.error)return toast(data?.error||error.message);toast('Contraseña actualizada')};

const platformOpenProduct=openProduct;
openProduct=function(id,options={}){platformOpenProduct(id,options);const modal=document.querySelector('#productModal');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',current?.name||'Detalle del producto');const track=modal.querySelector('.pd-main-track');if(track&&track.children.length>1&&!modal.querySelector('.swipe-hint')){const hint=document.createElement('p');hint.className='swipe-hint';hint.textContent='Desliza para ver más fotos';track.after(hint)}setTimeout(()=>modal.querySelector('.close')?.focus(),0)};
const platformRenderCart=renderCart;
renderCart=function(){platformRenderCart();document.querySelectorAll('#cartList .cart-row img').forEach((image,index)=>image.alt=cart[index]?.name||'Producto');document.querySelectorAll('#cartList .cart-row>.icon-btn').forEach((button,index)=>button.setAttribute('aria-label','Quitar '+(cart[index]?.name||'producto')))};
document.querySelectorAll('.modal').forEach(modal=>{modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true')});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const viewer=document.querySelector('#imageViewer.show');if(viewer){viewer.classList.remove('show');return}const modal=[...document.querySelectorAll('.modal.show')].pop();if(modal)closeModal(modal.id)});
window.addEventListener('online',()=>{showOfflineNotice(false);if(!isPortalHome())loadStore()});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',()=>toast('Tienda AG se actualizó correctamente'));
