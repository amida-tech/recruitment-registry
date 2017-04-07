'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('answer_identifier', {
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: 'identifier',
        },
        identifier: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: 'identifier',
        },
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question',
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
        multipleIndex: {
            type: DataTypes.INTEGER,
            field: 'multiple_index',
        },
        tag: {
            type: DataTypes.INTEGER,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [{ fields: ['question_id', 'question_choice_id'] }],
    });
};
