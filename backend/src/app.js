import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

import config from './config/index.js';
import swaggerSpec from './config/swagger.js';
import sequelize from './config/database.js';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://lahacienda.online'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes de productos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a base de datos establecida');

    app.listen(config.port, () => {
      console.log(`Servidor corriendo en http://localhost:${config.port}`);
      console.log(`Documentación API: http://localhost:${config.port}/api/docs`);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
