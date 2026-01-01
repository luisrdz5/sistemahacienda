'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cortes', 'consumo_masa', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cortes', 'consumo_masa');
  }
};
