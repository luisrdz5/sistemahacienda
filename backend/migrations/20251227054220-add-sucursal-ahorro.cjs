'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('sucursales', [
      {
        nombre: 'Ahorro',
        direccion: 'Gastos destinados a ahorro',
        tipo: 'virtual',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sucursales', { nombre: 'Ahorro' });
  }
};
