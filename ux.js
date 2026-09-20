
const uxStyle=document.createElement('style');
uxStyle.textContent=`
body.admin-mode>.shell,body.admin-mode>.bottom{display:none}body.admin-mode{background:#f5f5f8}
#adminModal.show{position:relative;inset:auto;display:block;background:#f5f5f8;min-height:100dvh;z-index:50}
#adminModal>.sheet{max-width:1120px;width:100%;max-height:none;min-height:100dvh;overflow:visible;border-radius:0;box-shadow:none;margin:0 auto;padding:20px 24px 90px;background:#f5f5f8}
#adminModal>.sheet>.close{float:none;width:auto;height:auto;padding:10px 16px;border-radius:12px;background:#fff;margin-bottom:20px;font-size:.9rem;font-weight:700;border:1px solid #ddd}
#adminContent>.admin-tabs{position:sticky;top:0;z-index:10;background:#f5f5f8;padding:12px 0;margin:0 0 20px;border-bottom:1px solid #ddd}
#adminContent>.profile-title{margin-bottom:16px}.admin-card{box-shadow:0 3px 12px #24203905;padding:20px;border-radius:16px}
.settings-group{border:1px solid var(--line);border-radius:16px;background:#fff;overflow:hidden}.settings-group>summary{cursor:pointer;font-weight:800;padding:18px 20px}.settings-group>.admin-card{border:0;box-shadow:none}.settings-group>.admin-card>h3{display:none}.settings-group[open]>summary{border-bottom:1px solid var(--line)}
#settingsForm>.admin-save{position:sticky;bottom:16px;z-index:9;box-shadow:0 6px 24px #0002;min-height:48px}
.palette-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin:16px 0}.palette-choice{border:1px solid #ddd;border-radius:14px;padding:12px;background:#fff;color:#292332;font-weight:700}.palette-choice[aria-pressed=true]{outline:2px solid var(--wine)}
.palette-swatches{display:flex;justify-content:center;gap:5px;margin-bottom:8px}.palette-swatches i{display:block;width:20px;height:20px;border-radius:50%;border:1px solid #0001}
.color-control{display:grid;grid-template-columns:54px minmax(0,1fr);gap:9px;align-items:center}.color-control input[type=color]{width:54px;height:46px;padding:4px;border-radius:12px;cursor:pointer}.color-code-input{font-family:ui-monospace,SFMono-Regular,Consolas,monospace!important;text-transform:uppercase;letter-spacing:.04em}.color-code-input:invalid{border-color:#b42318!important;box-shadow:0 0 0 3px #b4231814!important}.color-help{display:block;margin-top:5px;color:#756d7d;font-size:.72rem}
.editor-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(240px,1fr);gap:20px}.editor-layout .field{margin:14px 0}.editor-image{width:100%;max-height:300px;object-fit:contain;border-radius:14px;background:#faf7f8;margin-bottom:14px}
.editor-footer{position:sticky;bottom:0;background:#fff;padding:14px;border:1px solid var(--line);border-radius:14px;display:flex;gap:12px;justify-content:flex-end;z-index:8}.editor-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.editor-heading h3{margin:0}.help-copy{color:#756d7d;line-height:1.5;font-size:.9rem}
#productModal.show{align-items:center;justify-content:center}
#productModal>.sheet{width:min(720px,100%);height:min(760px,96dvh);max-height:96dvh;padding:0;overflow:hidden;display:flex;flex-direction:column;position:relative}
#productModal>.sheet>.close{position:absolute;right:14px;top:14px;z-index:4}
#productDetail{display:flex;flex-direction:column;min-height:0;height:100%}.pd-scroll{overflow:auto;min-height:0;padding:18px;flex:1}
.pd-photo{width:100%;height:clamp(100px,23dvh,220px);object-fit:contain;border-radius:14px;background:var(--brand-bg,#faf7f8)}.pd-info h2{font-size:1.45rem!important;margin:12px 0 6px!important}.pd-info .chips{margin:5px 0 10px}.pd-info .chip{padding:7px 12px}.pd-description{margin:10px 0;font-size:.88rem;line-height:1.45}.pd-description summary{cursor:pointer;color:var(--wine)}
.pd-actions{flex-shrink:0;border-top:1px solid var(--line);padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:#fff;display:grid;grid-template-columns:1fr 1fr;gap:10px;z-index:3}.pd-actions button{margin:0;min-height:48px;font-size:.88rem}
:root[data-card-size=compact] .product-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}:root[data-card-size=compact] .card{border-radius:14px}:root[data-card-size=compact] .card-body{padding:8px}:root[data-card-size=compact] .card h3{font-size:.88rem}:root[data-card-size=compact] .card .cat{font-size:.58rem}:root[data-card-size=compact] .card .quick{font-size:.75rem;padding:8px 4px}:root[data-card-size=compact] .card .price-line{flex-wrap:wrap;gap:3px;font-size:.85rem}
:root[data-card-size=large] .product-grid{grid-template-columns:repeat(1,minmax(0,1fr))}:root[data-card-size=large] .photo{aspect-ratio:1/1}
@media(min-width:700px){:root[data-card-size=compact] .product-grid{grid-template-columns:repeat(5,minmax(0,1fr))}:root[data-card-size=large] .product-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pd-scroll{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start}.pd-photo{height:100%;max-height:480px}}
@media(max-width:600px){#adminModal>.sheet{padding:14px 14px 90px}.editor-layout{grid-template-columns:1fr}.editor-layout .photo-editor{order:-1}.editor-image{max-height:160px}.admin-tabs .admin-tab{padding:11px;font-size:.83rem}}
`;document.head.appendChild(uxStyle);
const palettePresets=[
{name:'Burdeo',colors:['#772640','#a6536e','#fff7f9','#2b1720','#4f1428']},
{name:'Morado',colors:['#6d28a8','#9464cb','#f6f1fc','#271438','#40196c']},
{name:'Rosado',colors:['#a82f69','#d16e9c','#fff3f8','#3c1930','#722145']},
{name:'Amarillo',colors:['#806000','#a47a00','#fffbea','#382b0b','#655000']},
{name:'Beige',colors:['#74513b','#9a7050','#faf5ed','#392c25','#594332']},
{name:'Verde',colors:['#27614b','#43846b','#f1f8f3','#17372b','#1c4939']},
{name:'Negro',colors:['#26232b','#645c70','#f6f5f7','#211e26','#17141c']},
{name:'Azul marino',colors:['#12355b','#2f6690','#f1f6fb','#10243a','#0b2545']},
{name:'Esmeralda',colors:['#087f5b','#20a878','#effbf6','#12382d','#075c43']},
{name:'Terracota',colors:['#a3442f','#cf6b50','#fff4ef','#43231d','#7c2d1d']},
{name:'Rojo rubí',colors:['#9b1838','#c53d5d','#fff1f4','#3c1420','#6f1028']},
{name:'Azul petróleo',colors:['#0f5b66','#2b7f89','#eef8f8','#15383d','#0a414a']}
];
brandDefaults.card_size='normal';
const originalApplyBusinessUX=applyBusiness;
applyBusiness=function(b){originalApplyBusinessUX(b);document.documentElement.dataset.cardSize=['compact','large'].includes(b?.customization?.card_size)?b.customization.card_size:'normal'};
const originalOpenAdminUX=openAdminDashboard;
openAdminDashboard=async function(tab='settings'){
 document.body.classList.add('admin-mode');window.scrollTo(0,0);
 const back=document.querySelector('#adminModal>.sheet>.close');back.textContent='← Volver a la tienda';back.setAttribute('aria-label','Volver a la tienda');
 await originalOpenAdminUX(tab);
};
const originalCloseUX=closeModal;
closeModal=function(id){originalCloseUX(id);if(id==='adminModal'){document.body.classList.remove('admin-mode');window.scrollTo(0,0)}};
const originalSettingsUX=renderSettings;
renderSettings=function(){
 originalSettingsUX();const form=document.querySelector('#settingsForm');
 const paletteCard=document.createElement('section');paletteCard.className='admin-card';
 paletteCard.innerHTML='<h3>Tu estilo en un clic</h3><p class="help-copy">Elige una paleta y pulsa Guardar ajustes. Puedes afinar cada color en Colores y letras.</p><div class="palette-grid"></div><div class="field"><label for="cardDensity">Tamaño de las tarjetas de ropa</label><select id="cardDensity" name="card_size"><option value="compact">Pequeñas · 3 por fila en móvil</option><option value="normal">Medianas · 2 por fila en móvil</option><option value="large">Grandes · 1 por fila en móvil</option></select></div><p id="paletteStatus" role="status" class="help-copy"></p>';
 form.prepend(paletteCard);form.elements.card_size.value=managedBusiness.customization?.card_size||'normal';form.elements.card_size.onchange=()=>document.documentElement.dataset.cardSize=form.elements.card_size.value;
 for(const preset of palettePresets){const button=document.createElement('button');button.type='button';button.className='palette-choice';button.setAttribute('aria-pressed','false');
 button.innerHTML='<span class="palette-swatches">'+preset.colors.slice(0,3).map(c=>'<i style="background:'+c+'"></i>').join('')+'</span>'+preset.name;
 button.onclick=()=>{['primary_color','accent','background','text','hero_color'].forEach((key,i)=>{form.elements.namedItem(key).value=preset.colors[i]});form.querySelectorAll('.color-code-input').forEach(input=>{const picker=form.elements.namedItem(input.dataset.colorFor);if(picker)input.value=picker.value.toUpperCase()});document.documentElement.style.setProperty('--wine',preset.colors[0]);document.documentElement.style.setProperty('--wine2',preset.colors[1]);document.documentElement.style.setProperty('--brand-bg',preset.colors[2]);document.documentElement.style.setProperty('--ink',preset.colors[3]);if(typeof setThemeColor==='function')setThemeColor(preset.colors[0]);if(!managedBusiness.hero_image_url)document.querySelector('.hero').style.background=`linear-gradient(135deg,${preset.colors[4]},${preset.colors[0]})`;paletteCard.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));paletteCard.querySelector('#paletteStatus').textContent='Paleta '+preset.name+' seleccionada. Guarda para aplicarla.'};
 paletteCard.querySelector('.palette-grid').appendChild(button);}
 const liveColors={primary_color:'--wine',accent:'--wine2',background:'--brand-bg',text:'--ink'};
 Object.entries(liveColors).forEach(([field,variable])=>form.elements.namedItem(field)?.addEventListener('input',e=>document.documentElement.style.setProperty(variable,e.target.value)));
 ['primary_color','accent','background','text','hero_color'].forEach(name=>{const picker=form.elements.namedItem(name);if(!picker||picker.closest('.color-control'))return;const control=document.createElement('div');control.className='color-control';const code=document.createElement('input');code.type='text';code.className='color-code-input';code.dataset.colorFor=name;code.value=picker.value.toUpperCase();code.placeholder='#123456';code.maxLength=7;code.pattern='^#[0-9A-Fa-f]{6}$';code.setAttribute('aria-label','Código hexadecimal del color');picker.before(control);control.append(picker,code);const help=document.createElement('small');help.className='color-help';help.textContent='Puedes pegar un código, por ejemplo #123456.';control.after(help);picker.addEventListener('input',()=>{code.value=picker.value.toUpperCase();if(name==='primary_color'&&typeof setThemeColor==='function')setThemeColor(picker.value)});code.addEventListener('input',()=>{let value=code.value.trim();if(value&&!value.startsWith('#'))value='#'+value;if(/^#[0-9a-f]{6}$/i.test(value)){code.value=value.toUpperCase();picker.value=value;picker.dispatchEvent(new Event('input',{bubbles:true}))}})});
 const previewHero=()=>{if(!managedBusiness.hero_image_url)document.querySelector('.hero').style.background=`linear-gradient(135deg,${form.elements.hero_color.value},${form.elements.primary_color.value})`};
 form.elements.namedItem('hero_color')?.addEventListener('input',previewHero);form.elements.namedItem('primary_color')?.addEventListener('input',previewHero);
 form.elements.namedItem('name')?.addEventListener('input',e=>{document.querySelector('.brand').textContent=e.target.value||'Mi tienda'});
 form.elements.namedItem('hero_title')?.addEventListener('input',e=>{document.querySelector('.hero h2').textContent=e.target.value});
 form.elements.namedItem('hero_description')?.addEventListener('input',e=>{document.querySelector('.hero p').textContent=e.target.value});
 Array.from(form.children).filter(el=>el.classList.contains('admin-card')&&el!==paletteCard).forEach((card,i)=>{const title=card.querySelector('h3')?.textContent||'Más ajustes';const group=document.createElement('details');group.className='settings-group';group.open=i===0;const summary=document.createElement('summary');summary.textContent=title;card.before(group);group.append(summary,card)});
 const cover=document.querySelector('#hero_imageFile');const promptBox=document.createElement('div');promptBox.className='admin-card';promptBox.innerHTML='<strong>Prepara tu portada con ChatGPT</strong><p class="help-copy">Antes de subirla, adjunta tu foto en ChatGPT y pega este prompt. Descarga el resultado y selecciónalo aquí.</p><button type="button" class="btn btn-outline">Copiar prompt para mejorar mi foto</button><p class="help-copy" role="status"></p>';
 cover.parentElement.appendChild(promptBox);
 promptBox.querySelector('button').onclick=async()=>{const prompt='Mejora esta foto para usarla como portada de mi tienda de ropa. Conserva fielmente las personas, rostros, prendas, colores reales, logos y detalles del producto. Ajusta iluminación, balance de blancos, nitidez y contraste de manera natural; no inventes productos ni agregues texto o marcas de agua. Haz que la ropa destaque sobre un fondo limpio y elegante. Mantén el sujeto principal centrado y con margen alrededor para que la imagen funcione al recortarla en móvil y escritorio. Deja la zona inferior más despejada y aplica allí un degradado oscuro suave para que un título blanco superpuesto se lea bien. Entrega una foto profesional, sin aspecto artificial.';
 try{await navigator.clipboard.writeText(prompt);promptBox.querySelector('[role=status]').textContent='Prompt copiado. Pégalo junto con tu foto en ChatGPT.'}catch{const area=document.createElement('textarea');area.value=prompt;area.readOnly=true;promptBox.append(area);area.select()}};
};
productForm=function(p={}){
 const panel=adminContent.querySelector('[data-panel=products]');
 panel.innerHTML=`<form id="productForm" class="admin-grid">
 <div class="editor-heading"><div><h3>${p.id?'Editar producto':'Nuevo producto'}</h3><p class="help-copy">Foto, información y opciones de compra.</p></div><button type="button" class="btn btn-outline" onclick="renderProductAdmin()">Volver</button></div>
 <div class="editor-layout"><section class="admin-card"><h3>Información del producto</h3>
 <div class="field"><label for="editName">Nombre</label><input id="editName" name="name" required minlength="2" maxlength="120" value="${esc(p.name)}" placeholder="Ej. Falda midi plisada"></div>
 <div class="field"><label for="editCategory">Categoría</label><input id="editCategory" name="category" required value="${esc(p.category||'Productos')}" list="existingCategories"><datalist id="existingCategories">${[...new Set(adminProductsCache.map(x=>x.category))].map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div>
 <div class="two-col"><div class="field"><label for="editPrice">Precio de venta</label><input id="editPrice" name="price" type="number" min="0" step="1" required value="${esc(p.price??'')}"></div><div class="field"><label for="editOldPrice">Precio anterior (opcional)</label><input id="editOldPrice" name="old_price" type="number" min="0" step="1" value="${esc(p.old_price||'')}"></div></div>
 <div class="field"><label for="editDescription">Descripción</label><textarea id="editDescription" name="description" maxlength="3000">${esc(p.description)}</textarea></div>
 <div class="two-col"><div class="field"><label for="editSizes">Tallas</label><input id="editSizes" name="sizes" value="${esc((p.sizes||[]).join(', '))}" placeholder="S, M, L, XL"></div><div class="field"><label for="editColors">Colores disponibles</label><input id="editColors" name="colors" value="${esc((p.colors||[]).join(', '))}" placeholder="Negro, beige, rosado"></div></div><p class="help-copy">Separa las opciones con comas. Si no hay tallas, se mostrará «Única».</p></section>
 <aside class="admin-card photo-editor"><h3>Fotografía</h3><img class="editor-image" src="${esc(p.image_url||makeImg('Tu producto','#eee6ef','#faf7fa'))}" alt="Foto actual"><div class="field"><label for="productFile">Elegir o cambiar foto</label><input id="productFile" type="file" accept="image/jpeg,image/png,image/webp"></div><p class="help-copy">JPG, PNG o WebP · máximo 5 MB. La imagen se publica al guardar.</p><input type="hidden" name="image_url" value="${esc(p.image_url)}"><label><input name="active" type="checkbox" ${p.active!==false?'checked':''}> Mostrar en mi tienda</label></aside></div>
 <p class="profile-message" id="productMessage" role="status"></p><div class="editor-footer"><button type="button" class="btn btn-outline" onclick="renderProductAdmin()">Cancelar</button><button class="btn btn-wine" type="submit">Guardar producto</button></div></form>`;
 bindImagePreview(document.querySelector('#productFile'));document.querySelector('#productForm').onsubmit=e=>saveProduct(e,p.id);window.scrollTo(0,0);
};
openProduct=function(id){
 current=products.find(p=>String(p.id)===String(id));if(!current){toast('Este producto ya no está disponible');return}
 const variants=(values,type)=>`<div class="chips" data-variant="${type}">${values.map((v,i)=>`<button class="chip ${i===0?'selected':''}" type="button" onclick="pick(this)" aria-pressed="${i===0}">${esc(v)}</button>`).join('')}</div>`;
 document.querySelector('#productDetail').innerHTML=`<div class="pd-scroll"><img class="pd-photo" src="${esc(current.img)}" alt="${esc(current.name)}"><div class="pd-info"><p class="eyebrow">${esc(current.cat)}</p><h2>${esc(current.name)}</h2><div class="price-line"><span class="price">${CLP(current.price)}</span>${current.old?`<span class="old">${CLP(current.old)}</span>`:''}</div>${current.desc?`<details class="pd-description"><summary>Descripción y detalles</summary><p>${esc(current.desc)}</p></details>`:''}<strong>Talla</strong>${variants(current.sizes?.length?current.sizes:['Única'],'size')}<strong>Color</strong>${variants(current.colors?.length?current.colors:['Consultar'],'color')}</div></div><div class="pd-actions"><button class="btn btn-wine" type="button" id="detailAddCart">Agregar al carrito</button><button class="wa" type="button" id="detailWhatsapp">Comprar por WhatsApp</button></div>`;
 document.querySelector('#detailAddCart').onclick=addCart;document.querySelector('#detailWhatsapp').onclick=directWhatsapp;document.querySelector('#productModal').classList.add('show');document.querySelector('.pd-scroll').scrollTop=0;
};
pick=function(el){el.parentElement.querySelectorAll('.chip').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});el.classList.add('selected');el.setAttribute('aria-pressed','true')};
save=function(){try{const slug=new URLSearchParams(location.search).get('tienda')||'bellamujer';localStorage.setItem('bm_favs_'+slug,JSON.stringify(favs));localStorage.setItem('bm_cart_'+slug,JSON.stringify(cart))}catch(error){console.warn('No se pudo conservar el carrito en este dispositivo',error)}counts()};
addCart=function(){
 if(!current){toast('Selecciona un producto');return}
 const detail=document.querySelector('#productDetail');
 const size=detail.querySelector('[data-variant=size] .selected')?.textContent||current.sizes?.[0]||'Única';
 const color=detail.querySelector('[data-variant=color] .selected')?.textContent||current.colors?.[0]||'Consultar';
 const key=current.id+'|'+size+'|'+color;const row=cart.find(x=>x.key===key);
 if(row)row.qty=Number(row.qty||0)+1;else cart.push({key,id:current.id,name:current.name,price:Number(current.price),img:current.img,size,color,qty:1});
 save();closeModal('productModal');openCart();toast('Producto agregado al carrito');
};

document.querySelector('#adminModal').addEventListener('click',e=>{if(e.target===e.currentTarget)e.stopImmediatePropagation()},true);
const catalogStyle=document.createElement('style');catalogStyle.textContent=`.sold{top:44px;background:#555}.gallery-admin,.gallery-preview,.pd-gallery{display:flex;gap:8px;overflow:auto}.gallery-thumb{min-width:90px;font-size:.75rem}.gallery-thumb img,.gallery-preview img{width:80px;height:92px;object-fit:cover;border-radius:10px}.category-form{display:grid;grid-template-columns:1fr 70px auto;gap:8px}.category-row{display:grid;grid-template-columns:60px 1fr auto auto;gap:8px;align-items:center}.pd-gallery{scroll-snap-type:x mandatory}.pd-gallery .pd-photo{min-width:100%;scroll-snap-align:start}.stock-state{font-weight:800;color:var(--wine)}.pd-actions button:disabled{opacity:.55}.qty{display:flex;gap:12px;align-items:center;margin:7px 0}.qty button{width:30px;height:30px;border-radius:50%;border:1px solid var(--line);background:#fff}.checkout-fields{display:grid;gap:8px;padding:15px 0}.checkout-fields input,.checkout-fields textarea{width:100%;padding:12px;border:1px solid var(--line);border-radius:12px}@media(max-width:600px){.category-row{grid-template-columns:50px 1fr}.category-row label,.category-row .small-actions{grid-column:1/-1}.category-form{grid-template-columns:1fr 55px}.category-form button{grid-column:1/-1}}`;document.head.appendChild(catalogStyle);

uxStyle.textContent+=`.access-controls{display:grid;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}.access-controls input{padding:8px;border:1px solid var(--line);border-radius:8px}.access-controls button{padding:9px;border:1px solid var(--line);border-radius:9px;background:#fff}`;
uxStyle.textContent+=`.quick-edit{margin:-5px 0 10px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:#fff}.quick-edit summary{cursor:pointer;font-weight:800}.quick-fields{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin-top:10px}.quick-fields label{font-size:.8rem}.quick-fields input[type=number]{width:100px;padding:8px;border:1px solid var(--line);border-radius:8px}.quick-fields button{padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#fff}`;
