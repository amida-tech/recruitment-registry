'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('question', 'parameter', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
    });
  },
};
