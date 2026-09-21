const cleanSlug=value=>String(value||'').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,50);

export default function handler(request,response){
  const slug=cleanSlug(request.query?.tienda);
  const startUrl=slug?`/?tienda=${encodeURIComponent(slug)}`:'/';
  response.setHeader('Content-Type','application/manifest+json; charset=utf-8');
  response.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  response.status(200).json({
    name:'Tienda AG',short_name:'Tienda AG',
    description:'Catálogos digitales y tiendas independientes.',
    id:startUrl,start_url:startUrl,scope:'/',display:'standalone',
    background_color:'#0b0b0c',theme_color:'#111111',
    orientation:'portrait-primary',lang:'es-CL',categories:['shopping','lifestyle'],
    prefer_related_applications:false,
    icons:[
      {src:'/assets/icons/icon-192.png?v=20260921-2',sizes:'192x192',type:'image/png',purpose:'any maskable'},
      {src:'/assets/icons/icon-512.svg?v=20260921-2',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}
    ]
  });
}
