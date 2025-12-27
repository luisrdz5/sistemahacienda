'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // PostgreSQL: Agregar nuevos valores al ENUM existente
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_usuarios_rol" ADD VALUE IF NOT EXISTS 'repartidor';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_usuarios_rol" ADD VALUE IF NOT EXISTS 'administrador_repartidor';
    `);
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL no permite eliminar valores de ENUM directamente
    // Se requeriría recrear el tipo completo, lo cual es destructivo
    // Por seguridad, no hacemos rollback de este cambio
    console.log('Rollback de ENUM no soportado en PostgreSQL');
  }
};
