import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DetalleCierre = sequelize.define('DetalleCierre', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cortePedidoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'corte_pedido_id'
  },
  tipo: {
    type: DataTypes.ENUM('entrega', 'abono'),
    allowNull: false
  },
  pedidoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'pedido_id'
  },
  abonoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'abono_id'
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  recibido: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'detalle_cierre',
  underscored: true,
  timestamps: true
});

export default DetalleCierre;
