'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Sucursal asignada al pedido (de donde se despacha)
    await queryInterface.addColumn('pedidos', 'sucursal_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'sucursales',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Sucursal de backup
    await queryInterface.addColumn('pedidos', 'sucursal_backup_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'sucursales',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Sucursal que realmente tomó el pedido (puede ser diferente si se transfirió)
    await queryInterface.addColumn('pedidos', 'sucursal_actual_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'sucursales',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Flag si fue transferido a sucursal backup
    await queryInterface.addColumn('pedidos', 'transferido', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Marca si la sucursal principal se declaró ocupada
    await queryInterface.addColumn('pedidos', 'sucursal_ocupada', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Timestamps para tracking de tiempos
    await queryInterface.addColumn('pedidos', 'fecha_asignacion', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Cuando una sucursal toma el pedido'
    });

    await queryInterface.addColumn('pedidos', 'fecha_despacho', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Cuando el pedido sale de la sucursal'
    });

    // Tiempos calculados en segundos
    await queryInterface.addColumn('pedidos', 'demora_preparacion_seg', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Segundos desde creación hasta despacho'
    });

    await queryInterface.addColumn('pedidos', 'demora_entrega_seg', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Segundos desde despacho hasta entrega'
    });

    await queryInterface.addColumn('pedidos', 'demora_total_seg', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Segundos desde creación hasta entrega'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pedidos', 'sucursal_id');
    await queryInterface.removeColumn('pedidos', 'sucursal_backup_id');
    await queryInterface.removeColumn('pedidos', 'sucursal_actual_id');
    await queryInterface.removeColumn('pedidos', 'transferido');
    await queryInterface.removeColumn('pedidos', 'sucursal_ocupada');
    await queryInterface.removeColumn('pedidos', 'fecha_asignacion');
    await queryInterface.removeColumn('pedidos', 'fecha_despacho');
    await queryInterface.removeColumn('pedidos', 'demora_preparacion_seg');
    await queryInterface.removeColumn('pedidos', 'demora_entrega_seg');
    await queryInterface.removeColumn('pedidos', 'demora_total_seg');
  }
};
