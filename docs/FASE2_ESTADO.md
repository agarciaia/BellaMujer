# BellaMujer — FASE 2

Estado técnico actual:

- Proyecto Supabase: `xtlvifcdwdrwbxjcnslk` (São Paulo / sa-east-1).
- Esquema de tienda aplicado en Supabase.
- RLS habilitado en las tablas públicas.
- Bucket público `product-images` con escritura restringida a administradores.
- Datos iniciales: 5 categorías, 6 productos y 39 variantes.
- Edge Function `manage-admin-user` activa con JWT obligatorio para gestión de usuarios por superadministrador.
- Rama de desarrollo: `fase-2-admin-supabase`.
- Producción/main no debe fusionarse hasta probar acceso administrador, CRUD, imágenes y publicación.

## Bootstrap pendiente

Crear una sola vez el primer usuario de Supabase Auth:

- email interno: `superadmin@admin.bellamujer.invalid`
- contraseña: la definida por el propietario
- email confirmado

Luego registrar su UUID en `public.admin_users` con:

- username: `SUPERADMIN`
- role: `super_admin`
- active: `true`
- display_name: `Super Administrador`

No guardar la contraseña en GitHub, SQL, frontend ni variables públicas.

## Vercel pendiente

Configurar variables de entorno:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

El endpoint `api/config.js` expone únicamente estos valores públicos al frontend. Nunca usar `service_role` en el navegador.
