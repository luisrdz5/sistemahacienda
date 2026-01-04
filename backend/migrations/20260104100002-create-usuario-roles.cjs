'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Crear tabla de roles adicionales por usuario
    await queryInterface.createTable('usuario_roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rol: {
        type: Sequelize.ENUM('admin', 'encargado', 'repartidor', 'administrador_repartidor', 'invitado', 'cliente'),
        allowNull: false
      },
      sucursal_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'sucursales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índice único para evitar duplicados
    await queryInterface.addIndex('usuario_roles', ['usuario_id', 'rol'], {
      unique: true,
      name: 'unique_usuario_rol'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuario_roles');
  }
};
