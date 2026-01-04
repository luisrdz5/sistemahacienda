import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UsuarioRol = sequelize.define('UsuarioRol', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id'
  },
  rol: {
    type: DataTypes.ENUM('admin', 'encargado', 'repartidor', 'administrador_repartidor', 'invitado', 'cliente'),
    allowNull: false
  },
  sucursalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sucursal_id'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuario_roles',
  underscored: true,
  timestamps: true
});

export default UsuarioRol;
