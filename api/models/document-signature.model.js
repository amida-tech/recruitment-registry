'use strict';

module.exports = function (sequelize, DataTypes) {
    const DocumentSignature = sequelize.define('document_signature', {
        documentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'document_id',
            unique: 'signature',
            references: {
                model: 'document',
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
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        classMethods: {
            createSignature: function (userId, documentId, tx) {
                const options = tx ? { transaction: tx } : {};
                return DocumentSignature.create({ userId, documentId }, options)
                    .then(({ id }) => ({ id }));
            }
        }
    });

    return DocumentSignature;
};
