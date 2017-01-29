'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('survey_question', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        line: {
            type: DataTypes.INTEGER
        },
        required: {
            type: DataTypes.BOOLEAN
        },
        skipRuleId: {
            type: DataTypes.INTEGER,
            field: 'answer_rule_id',
            references: {
                model: 'answer_rule',
                key: 'id'
            }
        },
        skipCount: {
            type: DataTypes.INTEGER,
            field: 'skip_count'
        },
        enableWhenQuestionId: {
            type: DataTypes.INTEGER,
            field: 'enable_when_question_id',
            refrences: {
                model: 'question',
                key: 'id'
            }
        },
        enableWhenFuleId: {
            type: DataTypes.INTEGER,
            field: 'enable_when_rule_id',
            references: {
                model: 'answer_rule',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true
    });
};
