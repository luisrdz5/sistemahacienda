# Sistema de Gestión de Tortillerías - Cortes Diarios

Sistema integral para la captura y consolidación de ventas, gastos e inventario de harina para una cadena de 10 sucursales.

## 🚀 Stack Tecnológico
- **Frontend:** React + Webpack (Mobile First)
- **Backend:** Node.js + Express
- **ORM:** Sequelize (PostgreSQL)
- **Infraestructura:** Docker & Docker Compose
- **Documentación:** Swagger / OpenAPI

## 🛠️ Estructura del Proyecto
- `/backend`: API REST y lógica de negocio.
- `/frontend`: Interfaz de usuario React.
- `/docker`: Archivos de configuración de contenedores.

## 📦 Instalación con Docker
1. Clonar el repositorio.
2. Configurar el archivo `.env` en la raíz.
3. Ejecutar:
   ```bash
   docker-compose up --build