'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar campos para el cierre de caja
    await queryInterface.addColumn('cortes_pedidos', 'efectivo_esperado', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn('cortes_pedidos', 'efectivo_recibido', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn('cortes_pedidos', 'diferencia', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn('cortes_pedidos', 'cerrado_por_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('cortes_pedidos', 'cerrado_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('cortes_pedidos', 'notas_cierre', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('cortes_pedidos', 'efectivo_esperado');
    await queryInterface.removeColumn('cortes_pedidos', 'efectivo_recibido');
    await queryInterface.removeColumn('cortes_pedidos', 'diferencia');
    await queryInterface.removeColumn('cortes_pedidos', 'cerrado_por_id');
    await queryInterface.removeColumn('cortes_pedidos', 'cerrado_at');
    await queryInterface.removeColumn('cortes_pedidos', 'notas_cierre');
  }
};
