'use strict';

module.exports = function surveyIdentifier(sequelize, Sequelize, schema) {
    const tableName = 'survey_identifier';
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
        indexes: [{ fields: ['survey_id'] }],
    });
};
