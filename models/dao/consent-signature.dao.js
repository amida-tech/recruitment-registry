'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const sequelize = db.sequelize;
const ConsentSignature = db.ConsentSignature;

module.exports = class ConsentSignatureDAO {
    constructor() {}

    createSignature(input, tx) {
        const options = tx ? { transaction: tx } : {};
        const record = Object.assign({}, input);
        record.language = record.language || 'en';
        record.ip = record.ip === undefined ? null : record.ip;
        record.userAgent = record.userAgent === undefined ? null : record.userAgent;
        return ConsentSignature.create(record, options)
            .then(({ id }) => ({ id }));
    }

    bulkCreateSignatures(consentDocumentsIds, commonProperties) {
        return sequelize.transaction((tx) => {
            const pxs = consentDocumentsIds.map((consentDocumentId) => {
                const input = Object.assign({ consentDocumentId }, commonProperties);
                return this.createSignature(input, tx);
            });
            return SPromise.all(pxs); // TODO: Sequelize bulkcreate during sequelize 4 migration.
        });
    }

    getSignatureHistory(userId) {
        return ConsentSignature.findAll({
            where: { userId },
            raw: true,
            attributes: ['consentDocumentId', 'language'],
            order: 'consent_document_id',
        })
            .then(signatures => signatures.map(sign => ({
                id: sign.consentDocumentId,
                language: sign.language,
            })));
    }
};
