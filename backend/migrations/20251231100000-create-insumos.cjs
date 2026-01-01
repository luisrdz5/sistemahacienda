'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('insumos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      unidad_base: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'kg'
      },
      unidad_compra: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'kg'
      },
      factor_conversion: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 1.0
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Insertar insumos iniciales
    await queryInterface.bulkInsert('insumos', [
      {
        nombre: 'Masa',
        unidad_base: 'kg',
        unidad_compra: 'maleta',
        factor_conversion: 50,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Papas',
        unidad_base: 'kg',
        unidad_compra: 'kg',
        factor_conversion: 1,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Totopos',
        unidad_base: 'kg',
        unidad_compra: 'kg',
        factor_conversion: 1,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: 'Salsas',
        unidad_base: 'litro',
        unidad_compra: 'litro',
        factor_conversion: 1,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('insumos');
  }
};
