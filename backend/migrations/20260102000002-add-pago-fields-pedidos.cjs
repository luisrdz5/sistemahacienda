'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar campo monto_pagado (suma de todos los abonos)
    await queryInterface.addColumn('pedidos', 'monto_pagado', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    // Agregar campo saldo_pendiente (calculado: total - monto_pagado)
    await queryInterface.addColumn('pedidos', 'saldo_pendiente', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    // Agregar campo observaciones (obligatorio si no pago o no entrego)
    await queryInterface.addColumn('pedidos', 'observaciones', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Agregar fecha de entrega real
    await queryInterface.addColumn('pedidos', 'fecha_entrega', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Agregar fecha de preparacion
    await queryInterface.addColumn('pedidos', 'fecha_preparado', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Agregar indices para busquedas por saldo pendiente
    await queryInterface.addIndex('pedidos', ['saldo_pendiente'], {
      name: 'pedidos_saldo_pendiente_idx'
    });
    await queryInterface.addIndex('pedidos', ['cliente_id', 'saldo_pendiente'], {
      name: 'pedidos_cliente_saldo_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('pedidos', 'pedidos_cliente_saldo_idx');
    await queryInterface.removeIndex('pedidos', 'pedidos_saldo_pendiente_idx');
    await queryInterface.removeColumn('pedidos', 'fecha_preparado');
    await queryInterface.removeColumn('pedidos', 'fecha_entrega');
    await queryInterface.removeColumn('pedidos', 'observaciones');
    await queryInterface.removeColumn('pedidos', 'saldo_pendiente');
    await queryInterface.removeColumn('pedidos', 'monto_pagado');
  }
};
