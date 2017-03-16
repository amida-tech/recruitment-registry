'use strict';

const SPromise = require('../../lib/promise');

module.exports = class ConsentSignatureDAO {
    constructor(db) {
        this.db = db;
    }

    createSignature(input, tx) {
        const ConsentSignature = this.db.ConsentSignature;

        const options = tx ? { transaction: tx } : {};
        const record = Object.assign({}, input);
        record.language = record.language || 'en';
        record.ip = record.ip === undefined ? null : record.ip;
        record.userAgent = record.userAgent === undefined ? null : record.userAgent;
        return ConsentSignature.create(record, options)
            .then(({ id }) => ({ id }));
    }

    bulkCreateSignatures(consentDocumentsIds, commonProperties) {
        const sequelize = this.db.sequelize;
        return sequelize.transaction((tx) => {
            const pxs = consentDocumentsIds.map((consentDocumentId) => {
                const input = Object.assign({ consentDocumentId }, commonProperties);
                return this.createSignature(input, tx);
            });
            return SPromise.all(pxs); // TODO: Sequelize bulkcreate during sequelize 4 migration.
        });
    }

    getSignatureHistory(userId) {
        const ConsentSignature = this.db.ConsentSignature;
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
