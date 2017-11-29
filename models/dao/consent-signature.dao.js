'use strict';

const Base = require('./base');

const dbDefaults = function (record) {
    return {
        language: record.language || 'en',
        ip: record.ip || null,
        userAgent: record.userAgent || null,
    };
};

module.exports = class ConsentSignatureDAO extends Base {
    createSignature(signature, transaction) {
        const options = transaction ? { transaction } : {};
        const record = Object.assign({}, signature, dbDefaults(signature));
        return this.db.ConsentSignature.create(record, options)
            .then(({ id }) => ({ id }));
    }

    bulkCreateSignatures(consentDocumentsIds, commonProperties) {
        const records = consentDocumentsIds.map((consentDocumentId) => {
            const record = { consentDocumentId };
            Object.assign(record, commonProperties, dbDefaults(commonProperties));
            return record;
        });
        return this.db.ConsentSignature.bulkCreate(records)
            .then(result => result.map(({ id }) => ({ id })));
    }

    getSignatureHistory(userId) {
        const ConsentSignature = this.db.ConsentSignature;
        return ConsentSignature.findAll({
            where: { userId },
            raw: true,
            attributes: ['consentDocumentId', 'language'],
            order: ['consent_document_id'],
        })
            .then(signatures => signatures.map(sign => ({
                id: sign.consentDocumentId,
                language: sign.language,
            })));
    }
};
