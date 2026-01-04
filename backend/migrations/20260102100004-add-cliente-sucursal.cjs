'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar sucursal principal del cliente
    await queryInterface.addColumn('clientes', 'sucursal_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'sucursales',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Agregar sucursal de backup del cliente
    await queryInterface.addColumn('clientes', 'sucursal_backup_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'sucursales',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clientes', 'sucursal_id');
    await queryInterface.removeColumn('clientes', 'sucursal_backup_id');
  }
};
