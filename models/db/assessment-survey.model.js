'use strict';

module.exports = function assessmentSurvey(sequelize, Sequelize, schema) {
    const tableName = 'assessment_survey';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        assessmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: {
                    schema,
                    tableName: 'assessment',
                },
                key: 'id',
            },
        },
        surveyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
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
        indexes: [{
            fields: ['assessment_id'],
            where: { deleted_at: { [Op.eq]: null } },
        }],
        paranoid: true,
    });
};
