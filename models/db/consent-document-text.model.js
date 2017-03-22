'use strict';

module.exports = function consentDocuemntText(sequelize, Sequelize, schema) {
    const tableName = 'consent_document_text';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        consentDocumentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'consent_document_id',
            references: {
                model: {
                    schema,
                    tableName: 'consent_document',
                },
                key: 'id',
            },
        },
        content: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        updateComment: {
            type: Sequelize.TEXT,
            field: 'update_comment',
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
