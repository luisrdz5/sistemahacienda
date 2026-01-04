import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HistorialPedido = sequelize.define('HistorialPedido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pedidoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'pedido_id'
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'usuario_id'
  },
  accion: {
    type: DataTypes.ENUM(
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
    ),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  datosAnteriores: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'datos_anteriores'
  },
  datosNuevos: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'datos_nuevos'
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ip_address'
  }
}, {
  tableName: 'historial_pedidos',
  underscored: true,
  timestamps: true,
  updatedAt: false, // Solo createdAt
  createdAt: 'created_at'
});

// Helper para registrar acciones
HistorialPedido.registrar = async function(pedidoId, usuarioId, accion, descripcion, opciones = {}) {
  return this.create({
    pedidoId,
    usuarioId,
    accion,
    descripcion,
    datosAnteriores: opciones.datosAnteriores || null,
    datosNuevos: opciones.datosNuevos || null,
    ipAddress: opciones.ipAddress || null
  });
};

// Mapeo de acciones a descripciones legibles
HistorialPedido.getAccionLabel = function(accion) {
  const labels = {
    creado: 'Pedido creado',
    editado: 'Pedido editado',
    estado_pendiente: 'Cambió a Pendiente',
    estado_preparado: 'Cambió a Preparado',
    estado_en_camino: 'Cambió a En Camino',
    estado_entregado: 'Cambió a Entregado',
    estado_cancelado: 'Pedido Cancelado',
    repartidor_asignado: 'Repartidor asignado',
    repartidor_cambiado: 'Repartidor cambiado',
    pago_registrado: 'Pago registrado',
    abono_registrado: 'Abono registrado',
    nota_agregada: 'Nota agregada'
  };
  return labels[accion] || accion;
};

export default HistorialPedido;
