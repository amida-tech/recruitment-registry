'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const models = require('../../models');
const SPromise = require('../../lib/promise');

module.exports = function consentSeed(example, inputModels) {
    const m = inputModels || models;
    const consentTypePxs = example.consentTypes.map(consentType => m.consentType.createConsentType(consentType));
    return SPromise.all(consentTypePxs)
        .then(ids => example.consentTypes.reduce((r, consentType, index) => {
            r[consentType.name] = ids[index].id;
            return r;
        }, {}))
        .then((typeMap) => {
            const documents = example.consentDocuments.map(({ typeByName, content }) => ({
                typeId: typeMap[typeByName],
                content,
            }));
            const consents = example.consents.map(({ name, sectionsByName }) => ({
                name,
                sections: sectionsByName.map(sectionName => typeMap[sectionName]),
            }));
            const documentsPx = documents.map(doc => m.consentDocument.createConsentDocument(doc));
            return SPromise.all(documentsPx)
                .then(() => {
                    const consentsPx = consents.map(consent => m.consent.createConsent(consent));
                    return SPromise.all(consentsPx);
                });
        });
};
