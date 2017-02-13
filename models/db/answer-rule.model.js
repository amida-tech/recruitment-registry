'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_rule', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        logic: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: 'answer_rule_logic',
                key: 'name'
            }
        },
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
            allowNull: true,
            references: {
                model: 'question',
                key: 'id'
            }
        },
        answerQuestionId: {
            type: DataTypes.INTEGER,
            field: 'answer_question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        skipCount: {
            type: DataTypes.INTEGER,
            field: 'skip_count'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ fields: ['survey_id'], where: { deleted_at: { $eq: null } } }]
    });
};
