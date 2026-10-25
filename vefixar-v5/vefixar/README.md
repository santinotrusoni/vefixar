# VEFIXAR
1. Supabase: crear proyecto, ejecutar `supabase/migrations/001_init.sql` en el SQL Editor.
2. Authentication > crear usuario; insertar su fila en `profiles` con rol admin (ver final del SQL).
3. Copiar `.env.example` a `.env.local` con URL y anon key. `npm install && npm run dev`.
4. Netlify: subir repo, cargar las mismas 2 variables de entorno. `netlify.toml` ya está listo.
5. Cargar WhatsApp, cotización y datos del negocio en la tabla `settings` (fila id=1).

6. Ejecutar tambien `002_brand_storage.sql` (logo, Instagram, bucket de imagenes) y cargar el numero de WhatsApp.
7. Ejecutar `003_cash_finance.sql` (caja, anulaciones, costos en ARS).
8. Ejecutar `004_repairs_inquiries.sql` (consultas/canje, seguimiento por enlace, repuestos).
9. Ejecutar `005_all_pending.sql`. En Netlify cargar tambien `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, nunca publica) para crear usuarios desde el panel. Configuracion (cotizacion, cuotas, datos) se edita en /admin/config.
