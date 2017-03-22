'use strict';

module.exports = function consentSignature(sequelize, Sequelize, schema) {
    const tableName = 'consent_signature';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        consentDocumentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'consent_document_id',
            unique: 'signature',
            references: {
                model: {
                    schema,
                    tableName: 'consent_document',
                },
                key: 'id',
            },
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            unique: 'signature',
            references: {
                model: {
                    schema,
                    tableName: 'registry_user',
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
        ip: {
            type: Sequelize.TEXT,
        },
        userAgent: {
            type: Sequelize.TEXT,
            field: 'user_agent',
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        updatedAt: false,
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
    });
};
