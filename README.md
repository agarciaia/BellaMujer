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

## Panel de administración

Perfil → Administrar tienda: ajustes, productos, fotos, precios, tallas, colores y visibilidad. WhatsApp, Instagram y TikTok se editan en Ajustes.

El superadministrador dispone de Perfiles para crear un negocio con usuario y contraseña, abrir su administración y suspender/reactivar su acceso. Cada negocio tiene un enlace y QR propios. El acceso original del propietario por correo se conserva; las cuentas nuevas aceptan usuario o correo.

Supabase aplica RLS a negocios, productos y miembros. La función create-business-admin verifica el JWT y el UUID del propietario. No hay claves secretas en el frontend.

Las seis prendas originales se conservaron en Supabase como catálogo editable. Las tiendas nuevas comienzan vacías. WhatsApp necesita el contacto real del negocio.

## Validación

Sitio estático sin compilación. `node --check admin.js` valida sintaxis. Para las pruebas DOM:

```sh
npm install --prefix /tmp/bellamujer-tests jsdom
JSDOM_PATH=/tmp/bellamujer-tests/node_modules/jsdom node tests/admin.test.cjs
```

Las pruebas cubren carga del panel, catálogo vacío, acciones UUID, escape de contenido y carrito por tienda. Las políticas se probaron con transacciones revertidas en Supabase. El propietario autorizó y superó la prueba de inicio de sesión.

## Personalización por administrador

Ajustes permite editar nombre, rubro, logo, portada, cinco colores, tipografías de títulos y cuerpo, textos de portada/catálogo, avisos, horarios, descripción, dirección, entregas/pagos, teléfono, correo, WhatsApp, Instagram, TikTok, Facebook, Maps y sitio web. Los campos vacíos de contacto se ocultan. Todas las opciones se guardan en el negocio asignado y se aplican en su enlace público.

Perfiles permite crear tantos negocios/administradores como se necesiten dentro de las cuotas del servicio. Al crear uno, el superadministrador puede copiar usuario, contraseña y enlace para entregarlos. La contraseña no se guarda en las tablas ni se puede consultar después.
