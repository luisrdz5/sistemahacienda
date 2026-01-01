import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Insumo = sequelize.define('Insumo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  unidadBase: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'kg',
    field: 'unidad_base'
  },
  unidadCompra: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'kg',
    field: 'unidad_compra'
  },
  factorConversion: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 1.0,
    field: 'factor_conversion'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'insumos',
  timestamps: true,
  underscored: true
});

export default Insumo;
