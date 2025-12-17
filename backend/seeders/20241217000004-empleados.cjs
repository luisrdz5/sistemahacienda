'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('empleados', [
      // Sucursal 1 - Hacienda Centro
      {
        nombre: 'Juan Pérez',
        sucursal_id: 1,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'María García',
        sucursal_id: 1,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Pedro López',
        sucursal_id: 1,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Sucursal 2 - Hacienda Norte
      {
        nombre: 'Ana Martínez',
        sucursal_id: 2,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Carlos Rodríguez',
        sucursal_id: 2,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Sucursal 3 - Hacienda Sur
      {
        nombre: 'Laura Sánchez',
        sucursal_id: 3,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Roberto Hernández',
        sucursal_id: 3,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('empleados', null, {});
  }
};
