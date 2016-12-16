'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_rule_value', {
        answerRuleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'answer_rule_id',
            references: {
                model: 'answer_rule',
                key: 'id'
            }
        },
        questionChoiceId: {
            type: DataTypes.INTEGER,
            field: 'question_choice_id',
            references: {
                model: 'question_choice',
                key: 'id'
            }
        },
        value: {
            type: DataTypes.TEXT
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true
    });
};
