'use strict';

module.exports = function profileSurvey(sequelize, Sequelize, schema) {
    const tableName = 'profile_survey';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        surveyId: {
            type: Sequelize.INTEGER,
            field: 'survey_id',
            references: {
                model: {
                    schema,
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
