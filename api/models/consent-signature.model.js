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
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        classMethods: {
            createSignature: function (userId, consentDocumentId, tx) {
                const options = tx ? { transaction: tx } : {};
                return ConsentSignature.create({ userId, consentDocumentId }, options)
                    .then(({ id }) => ({ id }));
            },
            bulkCreateSignatures: function (userId, consentDocumentsIds) {
                const pxs = consentDocumentsIds.map(consentDocumentId => {
                    return ConsentSignature.create({ userId, consentDocumentId });
                });
                return sequelize.Promise.all(pxs);
            }
        }
    });

    return ConsentSignature;
};
