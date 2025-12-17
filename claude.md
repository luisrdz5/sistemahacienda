# Configuración del Proyecto: Sistema de Cortes (Tortillerías)

## 🤖 Roles de Agente (Instrucciones de Contexto)
Para cualquier tarea, solicita a Claude asumir uno de estos roles:

1.  **Arquitecto**: Enfoque en diseño de DB (Postgres), estructura de carpetas, Docker Compose y flujos de datos. Prioriza escalabilidad y limpieza de arquitectura.
2.  **Backend Developer**: Enfoque en Node.js/Express/Sequelize. **Regla estricta: NO usar TypeScript**. Todo debe ser JS moderno (ESM). Documentación obligatoria con Swagger/JSDoc.
3.  **Frontend Developer**: Enfoque en React + Webpack. Diseño **Mobile First** para tablets/celulares de sucursal. Uso de componentes funcionales y CSS limpio.

## 🛠 Comandos del Proyecto
- **Instalar dependencias**: `npm install` (en /backend y /frontend)
- **Levantar entorno (Docker)**: `docker-compose up --build`
- **Backend**: `npm run dev` (usando nodemon)
- **Frontend**: `npm start` (webpack dev server)
- **Base de Datos**: `npx sequelize-cli db:migrate`

## 📏 Guía de Estilo y Reglas
- **Lenguaje**: JavaScript puro (ES6+). Prohibido el uso de archivos `.ts` o `.tsx`.
- **Backend**: 
    - Usar Sequelize para modelos.
    - Los controladores deben manejar errores con bloques try/catch.
    - Cada ruta debe estar documentada para Swagger.
- **Frontend**: 
    - Arquitectura basada en componentes funcionales y Hooks.
    - Estilo Mobile First (priorizar pantallas pequeñas para los encargados).
- **Naming**: camelCase para variables/funciones, PascalCase para Componentes y Modelos.

## 🗄 Estructura Sugerida
- `/backend`: API, Modelos, Migraciones, Config de Swagger.
- `/frontend`: Código fuente de React, Webpack config.
- `/docker`: Dockerfiles y scripts de inicialización de DB.