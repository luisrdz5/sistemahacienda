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
    allowNull: false
    // Nota: La validación de monto negativo se hace en el controlador
    // Solo se permite monto negativo para la sucursal "Ahorro"
  }
}, {
  tableName: 'gastos',
  timestamps: true
});

export default Gasto;
