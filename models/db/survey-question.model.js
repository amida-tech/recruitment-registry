'use strict';

module.exports = function surveyQuestion(sequelize, Sequelize, schema) {
    const tableName = 'survey_question';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
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
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: {
                    schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        line: {
            type: Sequelize.INTEGER,
        },
        required: {
            type: Sequelize.BOOLEAN,
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
        indexes: [{ unique: true, fields: ['survey_id', 'question_id'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};
