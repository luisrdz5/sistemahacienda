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
  }
}, {
  tableName: 'cortes_pedidos',
  timestamps: true
});

export default CortePedidos;
