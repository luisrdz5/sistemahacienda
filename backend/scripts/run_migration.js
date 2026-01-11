import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const sql = `
-- Crear tabla historial_pedidos
CREATE TABLE IF NOT EXISTS historial_pedidos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(50) NOT NULL,
  descripcion TEXT,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_historial_pedidos_pedido_id ON historial_pedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_historial_pedidos_usuario_id ON historial_pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_pedidos_created_at ON historial_pedidos(created_at);
`;

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    await client.query(sql);
    console.log('Tabla historial_pedidos creada exitosamente');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

run();
