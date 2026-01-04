'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar clienteId a abonos
    await queryInterface.addColumn('abonos', 'cliente_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'clientes',
        key: 'id'
      }
    });

    // Hacer pedidoId opcional (para pagos a nivel cliente)
    await queryInterface.changeColumn('abonos', 'pedido_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Agregar índice para búsquedas por cliente
    await queryInterface.addIndex('abonos', ['cliente_id'], {
      name: 'idx_abonos_cliente'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('abonos', 'idx_abonos_cliente');
    await queryInterface.removeColumn('abonos', 'cliente_id');
    await queryInterface.changeColumn('abonos', 'pedido_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
