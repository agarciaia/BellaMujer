# BellaMujer

PWA BellaMujer construida a partir de `BellaMujer_PREVIEW_LOCAL.html`, manteniendo la interfaz y las funciones comerciales existentes.

## Publicación

Proyecto estático compatible con Vercel. No requiere build.

## Archivos principales

- `index.html`: aplicación real publicada.
- `manifest.json`: metadatos PWA.
- `service-worker.js`: caché del app shell y soporte offline básico.
- `assets/icons/`: iconos PWA/Apple.
- `supabase/README.md`: estado de la conexión y siguientes módulos.

El archivo fuente original se conserva sin cambios en el paquete de respaldo de la publicación V1.

## Perfil y autenticación

La aplicación está conectada a Supabase Auth. El botón **Perfil** permite iniciar sesión, conservar la sesión en la PWA instalada, consultar el estado de la cuenta y cerrar sesión. El usuario propietario se reconoce por su UUID confirmado en Supabase.

## Siguiente fase

Conexión a Supabase, panel administrador, catálogo dinámico, Storage de imágenes, stock, promociones y configuración de redes sociales.
