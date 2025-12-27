'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('productos', [
      {
        nombre: 'Tortillas',
        unidad: 'kg',
        precio_lista: 25.00,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Totopos',
        unidad: 'kg',
        precio_lista: 35.00,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Sopes',
        unidad: 'docena',
        precio_lista: 30.00,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Refresco',
        unidad: 'pieza',
        precio_lista: 20.00,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('productos', {
      nombre: ['Tortillas', 'Totopos', 'Sopes', 'Refresco']
    });
  }
};
