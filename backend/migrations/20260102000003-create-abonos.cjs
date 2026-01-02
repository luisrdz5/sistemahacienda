'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Crear tipo ENUM para tipo de pago
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_abonos_tipo" AS ENUM('efectivo', 'transferencia', 'otro');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('abonos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pedidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tipo: {
        type: Sequelize.ENUM('efectivo', 'transferencia', 'otro'),
        allowNull: false,
        defaultValue: 'efectivo'
      },
      notas: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      registrado_por_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    // Indices
    await queryInterface.addIndex('abonos', ['pedido_id'], {
      name: 'abonos_pedido_id_idx'
    });
    await queryInterface.addIndex('abonos', ['created_at'], {
      name: 'abonos_created_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('abonos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_abonos_tipo";');
  }
};
