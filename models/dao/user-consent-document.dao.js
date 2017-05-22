'use strict';

const Base = require('./base');

const signatureToInfo = function (signature) {
    if (signature) {
        return { signature: true, language: signature.language };
    }
    return { signature: false };
};

const addSignatureInfo = function (consentDocument, signature) {
    return Object.assign(consentDocument, signatureToInfo(signature));
};

module.exports = class UserConsentDocumentDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    listUserConsentDocuments(userId, options = {}) {
        const includeSigned = options.includeSigned;
        const consentDocOptions = Object.assign({ summary: true }, options);
        delete consentDocOptions.includeSigned;
        return this.consentDocument.listConsentDocuments(consentDocOptions)
            .then((activeDocuments) => {
                const attributes = ['consentDocumentId'];
                if (includeSigned) {
                    attributes.push('language');
                }
                const query = { where: { userId }, raw: true, attributes };
                if (options.transaction) {
                    query.transaction = options.transaction;
                }
                return this.db.ConsentSignature.findAll(query)
                    .then(docs => new Map(docs.map(r => [r.consentDocumentId, r])))
                    .then((docMap) => {
                        if (includeSigned) {
                            activeDocuments.forEach((activeDocument) => {
                                const signature = docMap.get(activeDocument.id);
                                addSignatureInfo(activeDocument, signature);
                            });
                            return activeDocuments;
                        }
                        return activeDocuments.filter(r => !docMap.has(r.id));
                    });
            });
    }

    fillSignature(result, userId, id) {
        return this.db.ConsentSignature.findOne({
            where: { userId, consentDocumentId: id },
            raw: true,
            attributes: ['language'],
        })
            .then(signature => addSignatureInfo(result, signature));
    }

    getUserConsentDocument(userId, id, options) {
        return this.consentDocument.getConsentDocument(id, options)
            .then(result => this.fillSignature(result, userId, id));
    }

    getUserConsentDocumentByTypeId(userId, typeId, options = {}) {
        return this.consentDocument.getConsentDocumentByTypeId(typeId, options)
            .then(result => this.fillSignature(result, userId, result.id));
    }
};
