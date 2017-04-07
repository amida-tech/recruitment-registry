'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('answer_rule_value', {
        ruleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'answer_rule_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'answer_rule',
                },
                key: 'id',
            },
        },
        questionChoiceId: {
            type: DataTypes.INTEGER,
            field: 'question_choice_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question_choice',
                },
                key: 'id',
            },
        },
        value: {
            type: DataTypes.TEXT,
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
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
