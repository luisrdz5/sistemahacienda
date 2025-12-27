import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PrecioCliente = sequelize.define('PrecioCliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cliente_id'
  },
  productoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'producto_id'
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'precios_cliente',
  timestamps: true
});

export default PrecioCliente;
