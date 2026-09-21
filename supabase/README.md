# Tienda AG — Supabase

Supabase Auth ya está conectado al perfil de la PWA. La sesión se conserva en el dispositivo instalado y el usuario propietario se identifica como superadministrador.

La base incluye aislamiento multitienda con RLS, catálogo por tienda, variantes, Storage y funciones administrativas protegidas. El catálogo público se entrega mediante `get_public_store(slug)`; las tablas no son enumerables por visitantes anónimos.
