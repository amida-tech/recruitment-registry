'use strict';

const _ = require('lodash');

const db = require('../db');

const ConsentSignature = db.ConsentSignature;

module.exports = class UserConsentDocumentDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    listUserConsentDocuments(userId, options = {}) {
        const _options = Object.assign({ summary: true }, options);
        return this.consentDocument.listConsentDocuments(_options)
            .then(activeDocs => {
                const query = {
                    where: { userId },
                    raw: true,
                    attributes: ['consentDocumentId'],
                    order: 'consent_document_id'
                };
                if (options.transaction) {
                    query.transaction = options.transaction;
                }
                return ConsentSignature.findAll(query)
                    .then(signedDocs => _.map(signedDocs, 'consentDocumentId'))
                    .then(signedDocIds => activeDocs.filter(activeDoc => signedDocIds.indexOf(activeDoc.id) < 0));
            });
    }

    _fillSignature(result, userId, id) {
        return ConsentSignature.findOne({
                where: { userId, consentDocumentId: id },
                raw: true,
                attributes: ['language']
            })
            .then(signature => {
                if (signature) {
                    result.signature = true;
                    result.language = signature.language;
                } else {
                    result.signature = false;
                }
                return result;
            });
    }

    getUserConsentDocument(userId, id, options) {
        return this.consentDocument.getConsentDocument(id, options)
            .then(result => this._fillSignature(result, userId, id));
    }

    getUserConsentDocumentByTypeName(userId, typeName, options = {}) {
        return this.consentDocument.getConsentDocumentByTypeName(typeName, options)
            .then(result => this._fillSignature(result, userId, result.id));
    }
};
