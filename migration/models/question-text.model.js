'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('question_text', {
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
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'language',
                },
                key: 'code',
            },
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        instruction: {
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
