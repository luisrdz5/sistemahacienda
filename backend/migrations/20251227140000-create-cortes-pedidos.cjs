'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cortes_pedidos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      repartidor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      total_pedidos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      estado: {
        type: Sequelize.ENUM('borrador', 'completado'),
        allowNull: false,
        defaultValue: 'borrador'
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

    // Unique constraint: un corte por repartidor por día
    await queryInterface.addIndex('cortes_pedidos', ['fecha', 'repartidor_id'], {
      unique: true,
      name: 'cortes_pedidos_fecha_repartidor_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cortes_pedidos');
  }
};
