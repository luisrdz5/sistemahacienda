'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar nuevo valor 'en_camino' al enum de estados de pedido
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_pedidos_estado" ADD VALUE IF NOT EXISTS 'en_camino';
    `);
  },

  async down(queryInterface, Sequelize) {
    // No se puede eliminar un valor de un enum en PostgreSQL fácilmente
    // Se requeriría recrear el tipo y la columna
    console.log('No se puede revertir: PostgreSQL no permite eliminar valores de enum');
  }
};
