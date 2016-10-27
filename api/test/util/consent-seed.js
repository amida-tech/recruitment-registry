'use strict';

const models = require('../../models');

const ConsentType = models.ConsentType;
const ConsentDocument = models.ConsentDocument;
const Consent = models.Consent;
const sequelize = models.sequelize;

module.exports = function (example) {
    const consentTypePxs = example.consentTypes.map(consentType => ConsentType.createConsentType(consentType));
    return sequelize.Promise.all(consentTypePxs)
        .then(ids => {
            return example.consentTypes.reduce((r, consentType, index) => {
                r[consentType.name] = ids[index].id;
                return r;
            }, {});
        })
        .then(typeMap => {
            const documents = example.consentDocuments.map(({ typeByName, content }) => ({
                typeId: typeMap[typeByName],
                content
            }));
            const consents = example.consents.map(({ name, sectionsByName }) => ({
                name,
                sections: sectionsByName.map(sectionName => typeMap[sectionName])
            }));
            const documentsPx = documents.map(doc => ConsentDocument.createConsentDocument(doc));
            return sequelize.Promise.all(documentsPx)
                .then(() => {
                    const consentsPx = consents.map(consent => Consent.createConsent(consent));
                    return sequelize.Promise.all(consentsPx);
                });
        });
};
