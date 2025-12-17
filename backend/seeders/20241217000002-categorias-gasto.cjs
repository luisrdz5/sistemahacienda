'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('categorias_gasto', [
      // Gastos operativos
      {
        nombre: 'Masa',
        tipo: 'operativo',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Comida',
        tipo: 'operativo',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Gasolina',
        tipo: 'operativo',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Jabón y Cloro',
        tipo: 'operativo',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Basura',
        tipo: 'operativo',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Mantenimiento',
        tipo: 'operativo',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Otros',
        tipo: 'operativo',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Nómina
      {
        nombre: 'Nómina',
        tipo: 'nomina',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categorias_gasto', null, {});
  }
};
