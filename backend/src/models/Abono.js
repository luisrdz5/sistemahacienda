import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Abono = sequelize.define('Abono', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pedidoId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Opcional: puede ser pago a nivel cliente
    field: 'pedido_id'
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Para pagos a nivel cliente
    field: 'cliente_id'
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('efectivo', 'transferencia', 'otro'),
    allowNull: false,
    defaultValue: 'efectivo'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  registradoPorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'registrado_por_id'
  }
}, {
  tableName: 'abonos',
  timestamps: true
});

export default Abono;
