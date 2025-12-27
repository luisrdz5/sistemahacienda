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
    type: DataTypes.ENUM('pendiente', 'entregado', 'cancelado'),
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
  }
}, {
  tableName: 'pedidos',
  timestamps: true
});

export default Pedido;
