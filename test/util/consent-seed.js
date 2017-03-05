'use strict';

const models = require('../../models');
const SPromise = require('../../lib/promise');

module.exports = function (example) {
    const consentTypePxs = example.consentTypes.map(consentType => models.consentType.createConsentType(consentType));
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
            const documentsPx = documents.map(doc => models.consentDocument.createConsentDocument(doc));
            return SPromise.all(documentsPx)
                .then(() => {
                    const consentsPx = consents.map(consent => models.consent.createConsent(consent));
                    return SPromise.all(consentsPx);
                });
        });
};
