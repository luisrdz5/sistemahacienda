'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar límite de crédito
    await queryInterface.addColumn('clientes', 'limite_credito', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 200.00
    });

    // Agregar email único para login
    await queryInterface.addColumn('clientes', 'email', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true
    });

    // Agregar campo de aprobación
    await queryInterface.addColumn('clientes', 'aprobado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clientes', 'limite_credito');
    await queryInterface.removeColumn('clientes', 'email');
    await queryInterface.removeColumn('clientes', 'aprobado');
  }
};
