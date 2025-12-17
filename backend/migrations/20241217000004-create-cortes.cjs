'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cortes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      sucursal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sucursales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      efectivo_caja: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      venta_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      inventario_nixta: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      inventario_extra: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      estado: {
        type: Sequelize.ENUM('borrador', 'completado'),
        defaultValue: 'borrador'
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

    // Índice único para fecha + sucursal
    await queryInterface.addIndex('cortes', ['fecha', 'sucursal_id'], {
      unique: true,
      name: 'cortes_fecha_sucursal_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cortes');
  }
};
