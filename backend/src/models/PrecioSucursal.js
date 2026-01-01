import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PrecioSucursal = sequelize.define('PrecioSucursal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sucursalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sucursal_id'
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
  tableName: 'precios_sucursal',
  timestamps: true
});

export default PrecioSucursal;
