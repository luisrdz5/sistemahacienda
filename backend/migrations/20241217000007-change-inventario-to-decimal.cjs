'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Cambiar inventario_nixta de INTEGER a DECIMAL para permitir cuartos de bulto
    await queryInterface.changeColumn('cortes', 'inventario_nixta', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    });

    // Cambiar inventario_extra de INTEGER a DECIMAL para permitir cuartos de bulto
    await queryInterface.changeColumn('cortes', 'inventario_extra', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir a INTEGER
    await queryInterface.changeColumn('cortes', 'inventario_nixta', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.changeColumn('cortes', 'inventario_extra', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
  }
};
