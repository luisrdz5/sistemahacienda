import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  limiteCredito: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 200.00,
    field: 'limite_credito'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  aprobado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  sucursalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sucursal_id'
  },
  sucursalBackupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sucursal_backup_id'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'clientes',
  timestamps: true
});

export default Cliente;
