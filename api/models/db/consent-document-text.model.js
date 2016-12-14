'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('consent_document_text', {
        consentDocumentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_document_id',
            references: {
                model: 'consent_document',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        updateComment: {
            type: DataTypes.TEXT,
            field: 'update_comment'
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: 'language',
                key: 'code'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deleteAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
