'use strict';

module.exports = function consentSignature(sequelize, Sequelize, schema) {
    return sequelize.define('consent_signature', {
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
        schema,
        createdAt: 'createdAt',
    });
};
