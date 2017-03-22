'use strict';

module.exports = function surveyText(sequelize, Sequelize, schema) {
    const tableName = 'survey_text';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
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
        language: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: {
                    schema,
                    tableName: 'language',
                },
                key: 'code',
            },
        },
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        description: {
            type: Sequelize.TEXT,
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
