'use strict';

module.exports = function userAssessmentAnswer(sequelize, Sequelize, schema) {
    const tableName = 'user_assessment_answer';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        answerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'answer_id',
            references: {
                model: {
                    schema,
                    tableName: 'answer',
                },
                key: 'id',
            },
        },
        userAssessmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_assessment_id',
            references: {
                model: {
                    schema,
                    tableName: 'user_assessment',
                },
                key: 'id',
            },
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
    });
};
