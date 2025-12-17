import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CategoriaGasto = sequelize.define('CategoriaGasto', {
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
  tipo: {
    type: DataTypes.ENUM('operativo', 'nomina'),
    allowNull: false,
    defaultValue: 'operativo'
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'categorias_gasto',
  timestamps: true
});

export default CategoriaGasto;
