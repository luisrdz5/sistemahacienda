import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: true // Nullable si usa Google
  },
  googleId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  avatarUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  rol: {
    type: DataTypes.ENUM('admin', 'encargado', 'repartidor', 'administrador_repartidor', 'invitado', 'cliente'),
    allowNull: false,
    defaultValue: 'encargado'
  },
  sucursalId: {
    type: DataTypes.INTEGER,
    allowNull: true // Nullable para admin
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'cliente_id'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  resetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'reset_token'
  },
  resetTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_token_expires'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.passwordHash) {
        usuario.passwordHash = await bcrypt.hash(usuario.passwordHash, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('passwordHash') && usuario.passwordHash) {
        usuario.passwordHash = await bcrypt.hash(usuario.passwordHash, 10);
      }
    }
  }
});

Usuario.prototype.validarPassword = async function(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

Usuario.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.passwordHash;
  return values;
};

export default Usuario;
