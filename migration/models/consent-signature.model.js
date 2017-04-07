'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('consent_signature', {
        consentDocumentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_document_id',
            unique: 'signature',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'consent_document',
                },
                key: 'id',
            },
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            unique: 'signature',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'registry_user',
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
        ip: {
            type: DataTypes.TEXT,
        },
        userAgent: {
            type: DataTypes.TEXT,
            field: 'user_agent',
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
    }, {
        updatedAt: false,
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
    });
};
