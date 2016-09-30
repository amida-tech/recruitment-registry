'use strict';

module.exports = function (sequelize, DataTypes) {
    const DocumentSignature = sequelize.define('document_signature', {
        documentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'document',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'registry_user',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
    });

    return DocumentSignature;
};
