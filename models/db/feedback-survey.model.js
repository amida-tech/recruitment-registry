'use strict';

module.exports = function feedbackSurvey(sequelize, Sequelize, schema) {
    const tableName = 'feedback_survey';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        feedbackSurveyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'feedback_survey_id',
            references: {
                model: {
                    schema,
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
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
        indexes: [{
            unique: true,
            fields: ['survey_id'],
            where: { deleted_at: { [Op.eq]: null } },
        }],
    });
};
