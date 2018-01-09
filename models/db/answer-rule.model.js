'use strict';

module.exports = function answerRule(sequelize, Sequelize, schema) {
    const tableName = 'answer_rule';
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
        logic: {
            type: Sequelize.TEXT,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'answer_rule_logic',
                },
                key: 'name',
            },
        },
        questionId: {
            type: Sequelize.INTEGER,
            field: 'question_id',
            allowNull: true,
            references: {
                model: {
                    schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        sectionId: {
            type: Sequelize.INTEGER,
            field: 'section_id',
            allowNull: true,
            references: {
                model: {
                    schema,
                    tableName: 'section',
                },
                key: 'id',
            },
        },
        answerQuestionId: {
            type: Sequelize.INTEGER,
            field: 'answer_question_id',
            allowNull: true,
            references: {
                model: {
                    schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        answerSurveyId: {
            type: Sequelize.INTEGER,
            field: 'answer_survey_id',
            allowNull: true,
            references: {
                model: {
                    schema,
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
        line: {
            type: Sequelize.INTEGER,
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
        indexes: [{ fields: ['survey_id'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};
