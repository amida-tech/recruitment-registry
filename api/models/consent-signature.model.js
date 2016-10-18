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
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        classMethods: {
            createSignature(userId, consentDocumentId, language, tx) {
                const options = tx ? { transaction: tx } : {};
                language = language || 'en';
                return ConsentSignature.create({ userId, consentDocumentId, language }, options)
                    .then(({ id }) => ({ id }));
            },
            bulkCreateSignatures(userId, consentDocumentsIds, language = 'en') {
                const pxs = consentDocumentsIds.map(consentDocumentId => {
                    return ConsentSignature.create({ userId, consentDocumentId, language });
                });
                return sequelize.Promise.all(pxs);
            },
            getSignatureHistory(userId) {
                return ConsentSignature.findAll({
                        where: { userId },
                        raw: true,
                        attributes: ['consentDocumentId', 'language'],
                        order: 'consent_document_id'
                    })
                    .then(signatures => signatures.map(sign => ({
                        id: sign.consentDocumentId,
                        language: sign.language
                    })));
            }
        }
    });

    return ConsentSignature;
};
