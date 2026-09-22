import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const OWNER="253c6a3c-f4b9-4be6-95f2-0c081789bf04";
const APP_ORIGINS=new Set(["https://tienda-ag.vercel.app","https://bellamujer.vercel.app"]);
const corsHeaders=(req:Request)=>({"Access-Control-Allow-Origin":APP_ORIGINS.has(req.headers.get("Origin")??"")?req.headers.get("Origin")!:"https://tienda-ag.vercel.app","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Vary":"Origin"});
Deno.serve(async req=>{
 const cors=corsHeaders(req),reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({error:"Método no permitido"},405);
 const url=Deno.env.get("SUPABASE_URL")??"",secrets=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")??"{}");
 const admin=createClient(url,secrets.default??Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",{auth:{persistSession:false}});
 const token=(req.headers.get("Authorization")??"").replace(/^Bearer\s+/i,"");
 const {data:{user}}=await admin.auth.getUser(token);if(user?.id!==OWNER&&user?.app_metadata?.role!=="superadmin")return reply({error:"Solo el superadministrador puede administrar accesos."},403);
 const body=await req.json().catch(()=>({}));
 if(body.action==="delete_business"){
  const businessId=String(body.businessId??"");if(!/^[0-9a-f-]{36}$/i.test(businessId))return reply({error:"Página inválida"},400);
  const {data:business,error:businessError}=await admin.from("businesses").select("id,name").eq("id",businessId).maybeSingle();
  if(businessError||!business)return reply({error:"La página no existe."},404);
  const {data:members,error:membersError}=await admin.from("business_members").select("user_id").eq("business_id",businessId);
  if(membersError)return reply({error:membersError.message},400);
  const {data:objects}=await admin.storage.from("product-images").list(businessId,{limit:1000});
  const paths=(objects??[]).map(item=>`${businessId}/${item.name}`);if(paths.length)await admin.storage.from("product-images").remove(paths);
  const {error:deleteError}=await admin.from("businesses").delete().eq("id",businessId);if(deleteError)return reply({error:deleteError.message},400);
  for(const member of members??[]){if(member.user_id!==OWNER)await admin.auth.admin.deleteUser(member.user_id)}
  return reply({ok:true,deleted:{id:business.id,name:business.name}});
 }
 const userId=String(body.userId??"");if(!/^[0-9a-f-]{36}$/i.test(userId))return reply({error:"Usuario inválido"},400);
 if(body.action==="password"){
  const password=String(body.password??"");if(password.length<12||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/\d/.test(password))return reply({error:"La contraseña debe tener 12 caracteres e incluir mayúscula, minúscula y número."},400);
  const {error}=await admin.auth.admin.updateUserById(userId,{password});return error?reply({error:error.message},400):reply({ok:true});
 }
 if(body.action==="access"){
  const trial=body.trialEndsAt?new Date(String(body.trialEndsAt)).toISOString():null;
  const {error}=await admin.from("business_members").update({active:Boolean(body.active),trial_ends_at:trial}).eq("user_id",userId);
  return error?reply({error:error.message},400):reply({ok:true});
 }
 return reply({error:"Acción inválida"},400);
});
