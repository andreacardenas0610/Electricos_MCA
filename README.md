# Eléctricos MCA

Aplicación web de gestión construida con React y Vite. El frontend está en la carpeta `frontend`; la API Node.js está en `backend`.

## Estructura

```text
frontend/
├── src/
│   ├── app/
│   │   └── components/       # Composición principal y navegación
│   ├── features/
│   │   ├── activities/components/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   └── styles/
│   │   ├── dashboard/components/
│   │   ├── inventory/components/
│   │   ├── management/components/ # Clientes, terceros y órdenes de servicio
│   │   ├── payments/components/
│   │   ├── quotes/components/
│   │   ├── services/components/
│   │   └── users/components/
│   ├── shared/
│   │   ├── components/       # Componentes reutilizados entre funcionalidades
│   │   ├── context/          # Estado visual compartido, como el tema
│   │   └── styles/           # Estilos globales compartidos
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
backend/
├── src/
│   ├── middleware/           # JWT y manejo de errores
│   ├── routes/               # Login, clientes, terceros y órdenes
│   └── server.js
├── .env.example
└── package.json
```

Cada funcionalidad mantiene sus pantallas y estilos dentro de su carpeta; los elementos reutilizados están en `shared`.

## Desarrollo

Configura `frontend/.env` copiando `frontend/.env.example` si la API no está en `http://localhost:3000/api`. Para probar el inicio de sesión y los módulos conectados, inicia frontend y backend en terminales separadas:

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run dev
```

Abre la dirección local que imprime Vite. El inicio de sesión y los módulos de clientes, terceros, órdenes, materiales, servicios, cotizaciones, pagos, agenda, usuarios y roles usan la API y PostgreSQL. Antes de usar los módulos, configura las variables de entorno, aplica las migraciones de la base de datos y crea la cuenta de administrador siguiendo [backend/README.md](./backend/README.md). Los datos de ejemplo que antes se guardaban en el navegador no se copian automáticamente a PostgreSQL.
