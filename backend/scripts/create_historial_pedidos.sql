-- Crear tabla historial_pedidos
CREATE TABLE IF NOT EXISTS historial_pedidos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(50) NOT NULL CHECK (accion IN (
    'creado',
    'editado',
    'estado_pendiente',
    'estado_preparado',
    'estado_en_camino',
    'estado_entregado',
    'estado_cancelado',
    'repartidor_asignado',
    'repartidor_cambiado',
    'pago_registrado',
    'abono_registrado',
    'nota_agregada'
  )),
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
