'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar nuevo valor 'cliente' al enum de roles
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_usuarios_rol ADD VALUE IF NOT EXISTS 'cliente';
    `);

    // Agregar columna cliente_id a usuarios (relación con cliente)
    await queryInterface.addColumn('usuarios', 'cliente_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'clientes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'cliente_id');
    // Nota: No se puede quitar valor del enum fácilmente en PostgreSQL
  }
};
