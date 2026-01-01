import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PrecioInsumo = sequelize.define('PrecioInsumo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  insumoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'insumo_id'
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fechaInicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'fecha_inicio'
  }
}, {
  tableName: 'precios_insumo',
  timestamps: true,
  underscored: true
});

export default PrecioInsumo;
