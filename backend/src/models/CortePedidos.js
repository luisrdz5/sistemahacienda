import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CortePedidos = sequelize.define('CortePedidos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  repartidorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'repartidor_id'
  },
  totalPedidos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_pedidos'
  },
  totalMonto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'total_monto'
  },
  estado: {
    type: DataTypes.ENUM('borrador', 'completado'),
    allowNull: false,
    defaultValue: 'borrador'
  },
  // Campos para cierre de caja
  efectivoEsperado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'efectivo_esperado'
  },
  efectivoRecibido: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'efectivo_recibido'
  },
  diferencia: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  cerradoPorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'cerrado_por_id'
  },
  cerradoAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cerrado_at'
  },
  notasCierre: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notas_cierre'
  }
}, {
  tableName: 'cortes_pedidos',
  timestamps: true
});

export default CortePedidos;
