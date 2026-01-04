'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('historial_pedidos', {
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
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      accion: {
        type: Sequelize.ENUM(
          'creado',
          'editado',
          'estado_pendiente',
          'estado_preparado',
          'estado_en_camino',
          'estado_entregado',
          'estado_cancelado',
          'repartidor_asignado',
          'repartidor_cambiado',
          'pago_registrado',
          'abono_registrado',
          'nota_agregada'
        ),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      datos_anteriores: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      datos_nuevos: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para búsquedas rápidas
    await queryInterface.addIndex('historial_pedidos', ['pedido_id']);
    await queryInterface.addIndex('historial_pedidos', ['usuario_id']);
    await queryInterface.addIndex('historial_pedidos', ['accion']);
    await queryInterface.addIndex('historial_pedidos', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('historial_pedidos');
  }
};
