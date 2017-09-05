'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('question_identifier', {
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
        indexes: [{ fields: ['question_id'] }],
    });
};
