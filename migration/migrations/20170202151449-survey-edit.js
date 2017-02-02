'use strict';

const surveyStatusTable = function (queryInterface, Sequelize) {
    return queryInterface.createTable('survey_status', {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            primaryKey: true
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false
    });
};

const surveyStatusRecords = ['draft', 'published', 'retired'].map(r => ({ name: r }));

const surveyStatusColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('survey', 'status', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'published',
        references: {
            model: 'survey_status',
            key: 'name'
        }
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        return surveyStatusTable(queryInterface, Sequelize)
            .then(() => queryInterface.bulkInsert('survey_status', surveyStatusRecords))
            .then(() => surveyStatusColumn(queryInterface, Sequelize));
    },

    down: function (queryInterface) {
        return queryInterface.removeColumn('survey', 'status')
            .then(() => queryInterface.dropTable());
    }
};
