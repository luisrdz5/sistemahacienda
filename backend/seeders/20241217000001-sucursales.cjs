'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('sucursales', [
      {
        nombre: 'Hacienda',
        direccion: 'Sucursal Hacienda',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Granada',
        direccion: 'Sucursal Granada',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Urbi',
        direccion: 'Sucursal Urbi',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sucursales', null, {});
  }
};
