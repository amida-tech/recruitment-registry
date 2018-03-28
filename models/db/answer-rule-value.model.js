'use strict';

module.exports = function answerRuleValue(sequelize, Sequelize, schema) {
    const tableName = 'answer_rule_value';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        ruleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'answer_rule_id',
            references: {
                model: {
                    schema,
                    tableName: 'answer_rule',
                },
                key: 'id',
            },
        },
        questionChoiceId: {
            type: Sequelize.INTEGER,
            field: 'question_choice_id',
            references: {
                model: {
                    schema,
                    tableName: 'question_choice',
                },
                key: 'id',
            },
        },
        value: {
            type: Sequelize.TEXT,
        },
        meta: {
            type: Sequelize.JSON,
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
