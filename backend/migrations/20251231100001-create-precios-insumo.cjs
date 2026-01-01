'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('precios_insumo', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      insumo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'insumos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      fecha_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    // Índices para búsquedas eficientes
    await queryInterface.addIndex('precios_insumo', ['insumo_id'], {
      name: 'precios_insumo_insumo_idx'
    });

    await queryInterface.addIndex('precios_insumo', ['insumo_id', 'fecha_inicio'], {
      name: 'precios_insumo_fecha_idx'
    });

    // Insertar precio inicial de Masa ($340 por maleta)
    await queryInterface.bulkInsert('precios_insumo', [
      {
        insumo_id: 1, // Masa
        precio: 340.00,
        fecha_inicio: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('precios_insumo');
  }
};
