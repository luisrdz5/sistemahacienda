'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('precios_sucursal', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sucursal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sucursales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      producto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'productos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
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

    // Índice único para evitar duplicados (una sucursal solo puede tener un precio por producto)
    await queryInterface.addIndex('precios_sucursal', ['sucursal_id', 'producto_id'], {
      unique: true,
      name: 'precios_sucursal_unique'
    });

    // Índices para búsquedas rápidas
    await queryInterface.addIndex('precios_sucursal', ['sucursal_id'], {
      name: 'precios_sucursal_sucursal_idx'
    });

    await queryInterface.addIndex('precios_sucursal', ['producto_id'], {
      name: 'precios_sucursal_producto_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('precios_sucursal');
  }
};
