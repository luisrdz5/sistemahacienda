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
  }
}, {
  tableName: 'pedidos',
  timestamps: true
});

export default Pedido;
