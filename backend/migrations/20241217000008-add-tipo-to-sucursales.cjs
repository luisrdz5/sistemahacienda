'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar campo tipo a sucursales
    await queryInterface.addColumn('sucursales', 'tipo', {
      type: Sequelize.ENUM('fisica', 'virtual'),
      defaultValue: 'fisica',
      allowNull: false
    });

    // Insertar sucursales virtuales
    await queryInterface.bulkInsert('sucursales', [
      {
        nombre: 'Nómina',
        direccion: 'Gastos de nómina de todas las sucursales',
        tipo: 'virtual',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Gastos Globales',
        direccion: 'Gastos generales de la empresa',
        tipo: 'virtual',
        activa: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    // Eliminar sucursales virtuales
    await queryInterface.bulkDelete('sucursales', {
      nombre: ['Nómina', 'Gastos Globales']
    });

    // Eliminar columna tipo
    await queryInterface.removeColumn('sucursales', 'tipo');

    // Eliminar el ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sucursales_tipo";');
  }
};
