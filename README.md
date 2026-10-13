# Eléctricos MCA

Aplicación web de gestión construida con React y Vite. El frontend está en la carpeta `frontend`.

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
```

Cada funcionalidad mantiene sus pantallas y estilos dentro de su carpeta; los elementos reutilizados están en `shared`.

## Desarrollo

Desde la raíz del repositorio, entra a `frontend` y ejecuta:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
```
