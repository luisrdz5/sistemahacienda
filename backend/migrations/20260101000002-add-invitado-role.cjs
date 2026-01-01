'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // En PostgreSQL, necesitamos modificar el tipo ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_usuarios_rol" ADD VALUE IF NOT EXISTS 'invitado';
    `);
  },

  async down(queryInterface, Sequelize) {
    // No se puede quitar un valor de ENUM en PostgreSQL fácilmente
    // Se deja como está
  }
};
