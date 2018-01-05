'use strict';

const surveyType = function (queryInterface, Sequelize) {
    return queryInterface.createTable('survey_type', {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
    });
};

const surveyColumnType = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('survey', 'type', {
        type: Sequelize.TEXT,
        allowNull: false,
        references: {
            model: 'survey_type',
            key: 'name',
        },
        defaultValue: 'normal',
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return surveyType(queryInterface, Sequelize)
          .then(() => surveyColumnType(queryInterface, Sequelize));
    },
};
