'use strict';

const models = require('../models');

const SPromise = require('../lib/promise');

const ConsentSignature = models.ConsentSignature;

module.exports = class {
	constructor() {
	}

    createSignature(userId, consentDocumentId, language, tx) {
        const options = tx ? { transaction: tx } : {};
        language = language || 'en';
        return ConsentSignature.create({ userId, consentDocumentId, language }, options)
            .then(({ id }) => ({ id }));
    }

    bulkCreateSignatures(userId, consentDocumentsIds, language = 'en') {
        const pxs = consentDocumentsIds.map(consentDocumentId => {
            return ConsentSignature.create({ userId, consentDocumentId, language });
        });
        return SPromise.all(pxs);
    }

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
};
