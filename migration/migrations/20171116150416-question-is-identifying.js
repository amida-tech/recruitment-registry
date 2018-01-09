'use strict';


const questionIdentifyColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'is_identifying', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
};


module.exports = {
    up: (queryInterface, Sequelize) => questionIdentifyColumn(queryInterface, Sequelize),
    down: queryInterface => queryInterface.removeColumn('question', 'is_identifying'),
};
