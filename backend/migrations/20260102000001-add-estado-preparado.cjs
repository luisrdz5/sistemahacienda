'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar nuevo valor 'preparado' al enum de estados de pedido
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_pedidos_estado" ADD VALUE IF NOT EXISTS 'preparado';
    `);
  },

  async down(queryInterface, Sequelize) {
    // No se puede eliminar un valor de un enum en PostgreSQL facilmente
    console.log('No se puede revertir: PostgreSQL no permite eliminar valores de enum');
  }
};
