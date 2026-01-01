import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Corte = sequelize.define('Corte', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  sucursalId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  efectivoCaja: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  ventaTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  inventarioNixta: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  inventarioExtra: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  consumoMasa: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'consumo_masa'
  },
  estado: {
    type: DataTypes.ENUM('borrador', 'completado'),
    defaultValue: 'borrador'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'cortes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['fecha', 'sucursal_id']
    }
  ]
});

// Método virtual para calcular el "debe"
Corte.prototype.getDebe = async function() {
  const gastos = await this.getGastos();
  const totalGastos = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
  return totalGastos - parseFloat(this.ventaTotal || 0) - parseFloat(this.efectivoCaja || 0);
};

export default Corte;
