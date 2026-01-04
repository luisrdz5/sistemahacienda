'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detalle_cierre', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      corte_pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cortes_pedidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.ENUM('entrega', 'abono'),
        allowNull: false
      },
      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'pedidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      abono_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'abonos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      recibido: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      notas: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Índices para búsquedas rápidas
    await queryInterface.addIndex('detalle_cierre', ['corte_pedido_id']);
    await queryInterface.addIndex('detalle_cierre', ['pedido_id']);
    await queryInterface.addIndex('detalle_cierre', ['abono_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('detalle_cierre');
  }
};
