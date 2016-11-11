'use strict';

module.exports = function (sequelize, DataTypes) {
    const ConsentSignature = sequelize.define('consent_signature', {
        consentDocumentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_document_id',
            unique: 'signature',
            references: {
                model: 'consent_document',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            unique: 'signature',
            references: {
                model: 'registry_user',
                key: 'id'
            }
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'language_code',
            reference: {
                model: 'language',
                key: 'code'
            }
        },
        ip: {
            type: DataTypes.TEXT
        },
        userAgent: {
            type: DataTypes.TEXT,
            field: 'user_agent'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        updatedAt: false,
        freezeTableName: true,
        createdAt: 'createdAt'
    });

    return ConsentSignature;
};
