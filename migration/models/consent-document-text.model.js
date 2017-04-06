'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('consent_document_text', {
        consentDocumentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_document_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'consent_document',
                },
                key: 'id',
            },
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        updateComment: {
            type: DataTypes.TEXT,
            field: 'update_comment',
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
