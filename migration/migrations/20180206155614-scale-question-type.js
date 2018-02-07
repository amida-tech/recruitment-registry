'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.addColumn('question', 'parameter', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
    }).then(() => queryInterface.sequelize.query('INSERT INTO question_type(name, created_at) VALUES (\'scale\', NOW())')),
};
