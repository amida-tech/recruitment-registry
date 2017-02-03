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
            .then(() => surveyStatusColumn(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('survey_question', ['survey_id', 'question_id'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'survey_question_survey_id_question_id',
                indicesType: 'UNIQUE'
            }));
    },

    down: function (queryInterface) {
        return queryInterface.removeIndex('survey_question', 'survey_question_survey_id_question_id')
            .then(() => queryInterface.removeColumn('survey', 'status'))
            .then(() => queryInterface.dropTable());
    }
};
