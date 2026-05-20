# AlimenTab web para iPhone

Esta carpeta contiene la version publicable de AlimenTab como PWA.

Archivos incluidos:
- `index.html`: app principal.
- `alimentab.webmanifest`: configuracion para instalar en iPhone.
- `service-worker.js`: permite que la app cargue mas rapido y funcione parcialmente sin conexion.
- `icons/`: iconos de instalacion.

## Para abrirla desde iPhone sin el PC encendido

La carpeta debe subirse a un hosting web con HTTPS. iCloud Drive sincroniza archivos, pero no publica una app web instalable por internet.

Opciones simples:
- Netlify: arrastrar esta carpeta al panel de Netlify.
- Cloudflare Pages: conectar esta carpeta a un repositorio.
- GitHub Pages: subir esta carpeta a un repositorio y publicar desde la rama principal.

Cuando tengas la URL HTTPS:
1. Abre la URL en Safari del iPhone.
2. Toca Compartir.
3. Toca Agregar a pantalla de inicio.
4. Abre AlimenTab desde el icono instalado.

## Importante sobre datos y Poder Judicial

Esta version guarda pagos y causas en el almacenamiento local del navegador del dispositivo. Si abres la app en iPhone y PC, cada dispositivo tendra sus propios datos hasta que agreguemos sincronizacion en la nube.

Para sincronizar datos entre iPhone y PC, esta version ya trae conexion opcional a Supabase. Debes crear un proyecto en Supabase y ejecutar el archivo `supabase-schema.sql` en el SQL Editor. Luego copia en AlimenTab:

- Project URL
- anon public key
- correo de acceso

La app usa inicio por enlace de correo. No uses ni pegues la `service_role key` en la app.

La descarga automatica de documentos del Poder Judicial no debe guardar ClaveUnica. Lo correcto es iniciar sesion en el sitio oficial y que un modulo autorizado use esa sesion para leer y descargar documentos. En iPhone esta automatizacion puede quedar limitada por las restricciones de Safari; para descarga masiva estable conviene que corra en una app de escritorio o servidor seguro.
