'use strict';

module.exports = function questionIdentifier(sequelize, Sequelize, schema) {
    const tableName = 'question_identifier';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        type: {
            type: Sequelize.TEXT,
            allowNull: false,
            unique: 'identifier',
        },
        identifier: {
            type: Sequelize.TEXT,
            allowNull: false,
            unique: 'identifier',
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
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [{ fields: ['question_id'] }],
    });
};
