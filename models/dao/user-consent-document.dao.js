'use strict';

module.exports = class UserConsentDocumentDAO {
    constructor(db, dependencies) {
        Object.assign(this, dependencies);
        this.db = db;
    }

    addSignatureInfo(consentDocument, signature) {
        if (signature) {
            consentDocument.signature = true;
            consentDocument.language = signature.language;
        } else {
            consentDocument.signature = false;
        }
        return consentDocument;
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
                    .then(signedDocuments => new Map(signedDocuments.map(signedDocument => [signedDocument.consentDocumentId, signedDocument])))
                    .then((signedDocumentMap) => {
                        if (includeSigned) {
                            activeDocuments.forEach((activeDocument) => {
                                const signature = signedDocumentMap.get(activeDocument.id);
                                this.addSignatureInfo(activeDocument, signature);
                            });
                            return activeDocuments;
                        }
                        return activeDocuments.filter(activeDocument => !signedDocumentMap.has(activeDocument.id));
                    });
            });
    }

    fillSignature(result, userId, id) {
        return this.db.ConsentSignature.findOne({
            where: { userId, consentDocumentId: id },
            raw: true,
            attributes: ['language'],
        })
            .then(signature => this.addSignatureInfo(result, signature));
    }

    getUserConsentDocument(userId, id, options) {
        return this.consentDocument.getConsentDocument(id, options)
            .then(result => this.fillSignature(result, userId, id));
    }

    getUserConsentDocumentByTypeName(userId, typeName, options = {}) {
        return this.consentDocument.getConsentDocumentByTypeName(typeName, options)
            .then(result => this.fillSignature(result, userId, result.id));
    }
};
