import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Gasto = sequelize.define('Gasto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  corteId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true // Nombre del empleado si es nómina
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'gastos',
  timestamps: true
});

export default Gasto;
