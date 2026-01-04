import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'cliente_id'
  },
  repartidorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'repartidor_id'
  },
  creadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'creado_por_id'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'preparado', 'en_camino', 'entregado', 'cancelado'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Campos de pago
  montoPagado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'monto_pagado'
  },
  saldoPendiente: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'saldo_pendiente'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fechaEntrega: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_entrega'
  },
  fechaPreparado: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_preparado'
  },
  // Tracking de sucursales
  sucursalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sucursal_id'
  },
  sucursalBackupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sucursal_backup_id'
  },
  sucursalActualId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sucursal_actual_id'
  },
  transferido: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  sucursalOcupada: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'sucursal_ocupada'
  },
  // Tracking de tiempos
  fechaAsignacion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_asignacion'
  },
  fechaDespacho: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_despacho'
  },
  demoraPreparacionSeg: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'demora_preparacion_seg'
  },
  demoraEntregaSeg: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'demora_entrega_seg'
  },
  demoraTotalSeg: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'demora_total_seg'
  }
}, {
  tableName: 'pedidos',
  timestamps: true
});

export default Pedido;
