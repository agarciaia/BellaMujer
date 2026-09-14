import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const OWNER="253c6a3c-f4b9-4be6-95f2-0c081789bf04";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({error:"Método no permitido"},405);
 const url=Deno.env.get("SUPABASE_URL")??"",secrets=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")??"{}");
 const admin=createClient(url,secrets.default??Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",{auth:{persistSession:false}});
 const token=(req.headers.get("Authorization")??"").replace(/^Bearer\s+/i,"");
 const {data:{user}}=await admin.auth.getUser(token);if(user?.id!==OWNER)return reply({error:"Solo el superadministrador puede administrar accesos."},403);
 const body=await req.json().catch(()=>({}));const userId=String(body.userId??"");if(!/^[0-9a-f-]{36}$/i.test(userId))return reply({error:"Usuario inválido"},400);
 if(body.action==="password"){
  const password=String(body.password??"");if(password.length<6)return reply({error:"La contraseña debe tener al menos 6 caracteres."},400);
  const {error}=await admin.auth.admin.updateUserById(userId,{password});return error?reply({error:error.message},400):reply({ok:true});
 }
 if(body.action==="access"){
  const trial=body.trialEndsAt?new Date(String(body.trialEndsAt)).toISOString():null;
  const {error}=await admin.from("business_members").update({active:Boolean(body.active),trial_ends_at:trial}).eq("user_id",userId);
  return error?reply({error:error.message},400):reply({ok:true});
 }
 return reply({error:"Acción inválida"},400);
});
