# Backend Eléctricos MCA

API REST pequeña con Express, PostgreSQL y JWT para clientes, técnicos terceros y órdenes de servicio. El inicio de sesión web y los módulos web de clientes, terceros y órdenes consumen esta API. La aplicación móvil todavía no está conectada.

## Instalación

```bash
cd backend
npm install
```

Copia `.env.example` a `.env`, configura PostgreSQL y coloca un `JWT_SECRET` aleatorio de al menos 32 caracteres. No subas `.env` al repositorio.

```bash
npm run dev
```

La API queda en `http://localhost:3000`; comprueba `GET /api/health`.

## Acceso y rutas

El administrador se autentica con `usuarios` y puede iniciar sesión en web o móvil. Los técnicos se autentican con `terceros` y solo pueden iniciar seleccionando móvil. Los técnicos solo ven sus órdenes asignadas; pueden actualizar su estado y seguimiento y subir/ver evidencias. Clientes, terceros y la creación/edición/eliminación de órdenes son acciones de administrador.

El login es `POST /api/auth/login`, con JSON:

```json
{
  "usuario": "admin",
  "password": "contraseña",
  "plataforma": "web"
}
```

El campo `plataforma` admite `web` o `movil`. Envía el JWT devuelto en `Authorization: Bearer <token>`.

El frontend toma la URL base desde `frontend/.env` (`VITE_API_URL`) y, si no está definida, usa `http://localhost:3000/api`. La sesión del administrador se mantiene en `sessionStorage` y se elimina al cerrar sesión o si la API responde que el token expiró.

| Método | Ruta | Permiso |
|---|---|---|
| GET, POST | `/api/clientes` | Administrador |
| GET, PUT, DELETE | `/api/clientes/:id` | Administrador |
| GET | `/api/clientes/catalogos/tipos-propiedad` | Administrador |
| GET, POST | `/api/terceros` | Administrador |
| GET, PUT, DELETE | `/api/terceros/:id` | Administrador |
| GET | `/api/ordenes-servicio` | Admin: todas; técnico: asignadas |
| GET | `/api/ordenes-servicio/catalogos` | Administrador |
| GET | `/api/ordenes-servicio/:id` | Admin o técnico asignado |
| POST, PUT, DELETE | `/api/ordenes-servicio` | Administrador |
| PATCH | `/api/ordenes-servicio/:id/estado` | Admin o técnico asignado |
| GET | `/api/ordenes-servicio/:id/seguimiento` | Admin o técnico asignado |
| GET, POST | `/api/ordenes-servicio/:id/evidencias` | Admin o técnico asignado |
| GET | `/api/ordenes-servicio/evidencias/:evidenciaId/archivo` | Admin o técnico de la orden |

Los errores de validación devuelven HTTP 400, las credenciales incorrectas 401, los accesos no permitidos 403 y los registros duplicados 409.

## Preparar PostgreSQL

Clientes utiliza las tablas `clientes`, `tipos_propiedad`, `contactos_cliente` y `direcciones_cliente`.

1. Si todavía no está la columna `usuarios.usuario`, ejecuta `database/001_agregar_usuario_login.sql`.
2. Para iniciar sesión con la cuenta actual del admin, ejecuta `npm run configurar-usuario` desde una terminal interactiva. Pregunta el usuario, el correo con que existe en la DB y su contraseña. Guarda el hash bcrypt, no la contraseña en texto plano.
3. Haz respaldo de la DB y revisa `database/002_tecnicos_movil_y_evidencias.sql`. Crea `terceros` si no existe. Si ya existe con otros nombres de columnas, compara y respalda primero: la migración agrega los campos que espera la API, pero no puede copiar los datos existentes automáticamente.
4. Ejecuta la migración una vez: agrega credenciales a `terceros`, la asignación `tercero_id` y fecha/servicio a órdenes, y las columnas para seguimiento y evidencias de terceros. Conserva la antigua relación a `usuarios`.
5. Después de crear el registro de un técnico externo, ejecuta `npm run configurar-tecnico`. Pide su documento, el nombre de usuario móvil y contraseña, y guarda el hash bcrypt.

Las migraciones no se ejecutan automáticamente. No vuelvas a correr el esquema inicial si contiene `DROP TABLE`. El seed compartido usa un hash de relleno inválido para el admin; el comando interactivo configura una contraseña que conozcan.

## Datos de ejemplo

Crear un cliente guarda sus datos principales y, si se envían, el contacto y dirección principal:

```json
{
  "nombre_razon_social": "Instalaciones del Norte S.A.S.",
  "documento_nit": "900123456-1",
  "tipo_cliente": "Jurídico",
  "tipo_propiedad_id": 2,
  "contacto": "Ana Pérez",
  "telefono": "3001234567",
  "correo_electronico": "ana@ejemplo.com",
  "direccion": "Calle 10 # 20-30",
  "municipio": "Medellín",
  "departamento": "Antioquia"
}
```

Crear un técnico:

```json
{
  "nombre_completo": "Carlos Pérez",
  "documento": "100200300",
  "empresa": "Servicios Eléctricos XYZ",
  "telefono": "3001234567",
  "correo_electronico": "carlos@ejemplo.com"
}
```

Crear una orden:

```json
{
  "codigo": "OS-2026-0002",
  "cliente_id": 1,
  "servicio_id": 1,
  "fecha_programada": "2026-11-02",
  "tercero_id": 1,
  "prioridad_id": 2,
  "estado_id": 1,
  "descripcion": "Revisión de instalación eléctrica"
}
```

Para cambiar estado desde móvil, usa `PATCH /api/ordenes-servicio/:id/estado` con `{"estado_id": 2, "comentario": "Inicié el trabajo."}`.

## Fotos y firma

Envía `POST /api/ordenes-servicio/:id/evidencias` como `multipart/form-data`:

- `archivo`: JPG, PNG o WEBP, hasta 5 MB.
- `tipo`: `Fotografía` o `Firma`.
- La firma debe enviarse como PNG.
- `observacion`: opcional.

El contenido binario se almacena en PostgreSQL como `BYTEA` en `evidencias_orden`. Esto es sencillo para el prototipo; la base crecerá con cada foto, así que para una versión de producción convendría almacenar los archivos en un servicio de objetos y guardar aquí solo sus URL.
