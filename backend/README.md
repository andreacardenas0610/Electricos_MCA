# Backend Eléctricos MCA

API REST con Express, PostgreSQL, JWT y `pg`. La base remota recomendada es Neon. Los módulos de negocio consultan la API; el navegador conserva solo la sesión temporal y la preferencia visual.

## Configuración

```bash
cd backend
npm install
```

Copia `.env.example` como `.env` y configura:

- `DATABASE_URL`: cadena de conexión pooled de Neon, con `?sslmode=require`.
- `JWT_SECRET`: secreto de al menos 32 caracteres.
- `FRONTEND_URL`: uno o más orígenes web permitidos, separados por comas.
- `MOBILE_ORIGINS`: orígenes de WebView móvil, separados por comas. No uses `*`.
- `SMTP_HOST` y credenciales SMTP: necesarios en producción para verificación y recuperación por correo.

El `.gitignore` raíz excluye `.env` y permite versionar `.env.example`. No incluyas credenciales reales en archivos versionados.

## Esquema y migraciones

### Base nueva

En una base vacía, ejecuta en este orden:

1. `database/schema.sql`
2. `database/seed.sql`

El esquema define una sola estructura PostgreSQL para acceso, clientes, órdenes, agenda, catálogo, materiales, historial, evidencias, firma, cotizaciones y pagos. El seed añade roles y catálogos, pero no crea contraseñas ni cuentas demo. Crea el primer administrador desde una terminal interactiva:

```bash
npm run crear-administrador
```

El comando oculta la contraseña, la guarda con bcrypt y solo permite el bootstrap si no hay ya una cuenta con rol Administrador.

### Base existente

Realiza y verifica un respaldo antes de cambiar producción. Conserva las migraciones históricas `001`–`007`: algunas migran datos antiguos y otras preparan tablas utilizadas por la API. Tras aplicarlas y revisar la estructura, ejecuta **una sola vez** `database/008_unificacion_acceso_ordenes_movil.sql`. La migración transfiere los hashes técnicos a `usuarios`, añade verificación y las estructuras móviles, y elimina las columnas de credenciales duplicadas de `terceros` después de validar la transferencia.

La migración `008` no se ejecuta al iniciar la API ni se ha ejecutado desde este cambio contra Neon. No vuelvas a ejecutarla ni uses el esquema limpio sobre una base existente. Corrige cualquier precondición o colisión que reporte y vuelve a respaldar antes de reintentar.

Después de confirmar `008`, ejecuta una sola vez `database/009_normalizacion_personas.sql`. Esta migración crea la entidad central `personas` y vincula por documento o correo los perfiles existentes de clientes, terceros/técnicos y usuarios. Conserva los perfiles históricos y no borra clientes, terceros, usuarios ni órdenes.

Luego de `009`, ejecuta una sola vez `database/010_sincronizar_datos_persona.sql`. Esta migración sincroniza cambios de documento, nombre, teléfono y correo entre los perfiles vinculados a la misma persona. No la ejecutes antes de `008` y `009`.

El modelo normalizado separa datos comunes y datos de perfil:

- `personas`: documento, nombre, teléfono y correo comunes.
- `usuarios`: credenciales, usuario, contraseña, rol y estado de acceso.
- `terceros`: datos laborales y técnicos.
- `clientes`: datos comerciales, propiedad y contactos.

Una persona puede estar vinculada simultáneamente a un cliente, un tercero/técnico y una cuenta de usuario. Los datos comunes se actualizan en `personas`; la API evita duplicar perfiles al crear o editar registros.

Al crear un tercero desde la aplicación también se crea, en la misma transacción, su cuenta móvil. Se define usuario, contraseña inicial y rol. El rol debe estar activo y habilitado solo para `Móvil`; los roles se pueden ampliar desde Gestión de roles. Si se edita un tercero antiguo sin cuenta, se puede crear su acceso desde el mismo formulario.

Los antiguos datos de negocio que solo estaban guardados en `localStorage` no se importan automáticamente; prepara una importación validada antes de retirar esos datos.

## Inicio local y Vercel

```bash
npm run check
npm run dev
```

La API local inicia en `http://localhost:3000`; `GET /api/health` debe responder `{"estado":"ok"}`. Para Vercel, configura como directorio raíz `backend` y define `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `MOBILE_ORIGINS` y SMTP en las variables del proyecto. En el proyecto del frontend, define `VITE_API_URL` como la URL pública del backend terminada en `/api`. Los cambios de variables de Vercel requieren un nuevo despliegue.

La CORS permite los orígenes configurados, los orígenes móviles locales listados en `.env.example` y solicitudes nativas sin `Origin`. Las solicitudes web no configuradas se rechazan.

## Acceso y contratos móviles

Los endpoints protegidos usan `Authorization: Bearer <token>` y devuelven errores JSON con la propiedad `mensaje`. El login requiere `plataforma: "web"` o `"movil"`; administradores tienen acceso web y móvil, técnicos usan móvil y requieren cuenta activa y verificada. El técnico solo consulta y actualiza las órdenes que tiene asignadas.

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/auth/login` | Autenticación de cuenta |
| POST | `/api/auth/registro` | Registro técnico; envía token de verificación |
| POST | `/api/auth/verificar` | Verifica identidad con token de un solo uso |
| POST | `/api/auth/recuperar` | Solicita recuperación sin revelar si existe la cuenta |
| POST | `/api/auth/restablecer` | Cambia contraseña con token temporal |
| GET | `/api/agendamiento` | Consulta la agenda; el técnico ve las actividades asignadas |
| GET | `/api/ordenes` y `/api/ordenes/:id` | Consulta órdenes asignadas o, para admin, todas |
| PATCH | `/api/ordenes/:id/estado` | Cambia estado con `estado` o `estado_id`; escribe historial |
| GET, POST | `/api/ordenes/:id/evidencias` | Consulta o registra fotos y firma |
| GET | `/api/ordenes/evidencias/:evidenciaId/archivo` | Descarga evidencia cargada como archivo |
| GET, POST | `/api/ordenes/:id/materiales` | Consulta/consume materiales y descuenta existencias en transacción |

El cambio de estado acepta, por ejemplo, `{"estado":"En Ejecución","comentario":"Inicio de trabajo"}` o `{"estado_id":3}`. Para evidencia, envía `multipart/form-data` con `archivo` (JPG, PNG o WEBP, máximo 5 MB), `tipo` (`Fotografía` o `Firma`) y `observacion` opcional; también puede enviarse una URL HTTPS en JSON. La firma como archivo debe ser PNG y actualiza `firma_cliente_url` y `fecha_firma`. Para materiales se envían `codigo` (o `material_codigo`) y `cantidad`.

Los aliases `/api/ordenes-servicio` y `/api/agenda` se conservan para la interfaz web y compatibilidad existente. Los cambios de estado registran usuario/técnico, estado anterior/nuevo y comentario en `historial_estados_orden`.

## Otros endpoints web

Clientes, terceros, catálogo, cotizaciones, pagos, usuarios y roles mantienen sus rutas `/api/clientes`, `/api/terceros`, `/api/materiales`, `/api/servicios`, `/api/cotizaciones`, `/api/pagos`, `/api/usuarios` y `/api/roles`; son de administración y requieren token de administrador. La agenda web se gestiona en `/api/agenda`.

Para asignar una cuenta existente a un perfil técnico, usa `npm run configurar-tecnico` desde una terminal interactiva. El comando requiere el documento del perfil y actualiza la cuenta enlazada con contraseña bcrypt.
