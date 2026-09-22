import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPERADMIN_ID = "253c6a3c-f4b9-4be6-95f2-0c081789bf04";
const APP_ORIGINS = new Set([
  "https://tienda-ag.vercel.app",
  "https://bellamujer.vercel.app",
]);
const corsHeaders = (req: Request) => ({
  "Access-Control-Allow-Origin": APP_ORIGINS.has(req.headers.get("Origin") ?? "")
    ? req.headers.get("Origin")!
    : "https://tienda-ag.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Vary": "Origin",
});

const neutralContent = {
  kicker: "Aquí coloca una frase breve sobre tu negocio",
  hero_title: "",
  hero_description: "Aquí cuenta qué vendes y qué hace especial a tu tienda.",
  hero_badge: "Aquí destaca una novedad",
  hero_button: "Ver productos",
  catalog_title: "Nuestros productos",
  about: "",
  hours: "",
  delivery: "",
  email: "",
  phone: "",
  facebook: "",
  maps: "",
  website: "",
  show_promos: true,
  promo_titles: ["Aquí destaca un beneficio", "Aquí anuncia una novedad", "Aquí inspira a tus clientes", "Aquí explica cómo comprar"],
  promo_details: ["Ejemplo: despacho, retiro o pago fácil.", "Ejemplo: nuevos productos cada semana.", "Comparte una idea que represente tu marca.", "Explica brevemente cómo hacer un pedido."],
};

const styleTemplates: Record<string, { primary_color: string; customization: Record<string, unknown> }> = {
  neutral: { primary_color: "#24262b", customization: { accent: "#8b8e96", background: "#f6f6f4", text: "#24262b", hero_color: "#34363b", font: "modern", body_font: "modern" } },
  dark: { primary_color: "#111216", customization: { accent: "#d2ab3d", background: "#0d0e11", text: "#f3f1eb", hero_color: "#17191e", font: "modern", body_font: "modern" } },
  navy: { primary_color: "#14263d", customization: { accent: "#b6985a", background: "#f4f2ed", text: "#182333", hero_color: "#14263d", font: "editorial", body_font: "modern" } },
  olive: { primary_color: "#596140", customization: { accent: "#b19a68", background: "#f3f0e7", text: "#303327", hero_color: "#50583a", font: "classic", body_font: "modern" } },
  beige: { primary_color: "#6c5745", customization: { accent: "#b89570", background: "#f7f1e8", text: "#322c28", hero_color: "#806b57", font: "editorial", body_font: "modern" } },
  terracotta: { primary_color: "#9a503e", customization: { accent: "#d4a068", background: "#fbf2ea", text: "#402b25", hero_color: "#8b4638", font: "rounded", body_font: "modern" } },
};

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: cors });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Método no permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const secrets = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
  const serviceKey = secrets.default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const isSuperAdmin=authData.user?.id===SUPERADMIN_ID||authData.user?.app_metadata?.role==="superadmin";
  if (authError || !isSuperAdmin) {
    return reply({ error: "Solo el superadministrador puede crear perfiles." }, 403);
  }

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return reply({ error: "Datos inválidos." }, 400); }
  const businessName = String(payload.businessName ?? "").trim();
  const username = String(payload.username ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  const templateKey = String(payload.template ?? "neutral");
  const selectedTemplate = styleTemplates[templateKey] ?? styleTemplates.neutral;
  let slug = String(payload.slug ?? "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

  if (businessName.length < 2 || !/^[a-z0-9._-]{3,30}$/.test(username) || password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return reply({ error: "Usa un nombre y usuario válidos, y una contraseña de 12 caracteres con mayúscula, minúscula y número." }, 400);
  }
  if (slug.length < 3) slug = username.replace(/[._]/g, "-");
  const email = `${username}@usuarios.tienda-ag.invalid`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { role: "business_admin" },
    user_metadata: { username, business_name: businessName },
  });
  if (createError || !created.user) {
    return reply({ error: createError?.message?.includes("already") ? "Ese usuario ya existe." : (createError?.message ?? "No se pudo crear el usuario.") }, 400);
  }

  const { data: business, error: businessError } = await admin.from("businesses")
    .insert({
      name: businessName,
      slug,
      created_by: authData.user.id,
      primary_color: selectedTemplate.primary_color,
      customization: { ...neutralContent, ...selectedTemplate.customization, hero_title: businessName },
    })
    .select("id,slug,name").single();
  if (businessError || !business) {
    await admin.auth.admin.deleteUser(created.user.id);
    return reply({ error: businessError?.code === "23505" ? "Ese enlace ya está ocupado." : (businessError?.message ?? "No se pudo crear el negocio.") }, 400);
  }

  const { error: memberError } = await admin.from("business_members").insert({
    business_id: business.id, user_id: created.user.id, username, role: "admin",
  });
  if (memberError) {
    await admin.from("businesses").delete().eq("id", business.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return reply({ error: memberError.message }, 400);
  }

  await admin.auth.admin.updateUserById(created.user.id, {
    app_metadata: { role: "business_admin", business_id: business.id },
  });
  return reply({ business, user: { id: created.user.id, username }, template: templateKey in styleTemplates ? templateKey : "neutral" }, 201);
});
