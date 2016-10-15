'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const fillSections = function (result) {
        const ConsentSection = sequelize.models.consent_section;
        return ConsentSection.findAll({
                where: { consentId: result.id },
                attributes: ['typeId'],
                raw: true,
                order: 'line'
            })
            .then(rawTypeIds => _.map(rawTypeIds, 'typeId'))
            .then(typeIds => {
                result.sections = typeIds;
                return result;
            });
    };

    const Consent = sequelize.define('consent', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        classMethods: {
            createConsent: function ({ name, sections }) {
                return sequelize.transaction(function (tx) {
                    return Consent.create({ name })
                        .then(({ id }) => {
                            const consentId = id;
                            const records = sections.map((typeId, line) => ({ consentId, typeId, line }));
                            const ConsentSection = sequelize.models.consent_section;
                            const pxs = records.map(record => ConsentSection.create(record)); // TODO: replace with bulkCreate when sequelize 4
                            return sequelize.Promise.all(pxs, { transaction: tx })
                                .then(() => ({ id }));
                        });
                });
            },
            getConsent: function (id) {
                return Consent.findById(id, { raw: true, attributes: ['id', 'name'] })
                    .then(result => fillSections(result));
            },
            getConsentByName: function (name) {
                return Consent.findOne({ where: { name }, raw: true, attributes: ['id', 'name'] })
                    .then(result => fillSections(result));
            },
            listConsents: function () {
                return Consent.findAll({ raw: true, attributes: ['id', 'name'], order: 'id' })
                    .then(consents => {
                        const ConsentSection = sequelize.models.consent_section;
                        return ConsentSection.findAll({ raw: true, attributes: ['consentId', 'typeId', 'line'] })
                            .then(allSections => _.groupBy(allSections, 'consentId'))
                            .then(allSections => {
                                return consents.map(consent => {
                                    const sections = _.sortBy(allSections[consent.id], 'line');
                                    consent.sections = _.map(sections, 'typeId');
                                    return consent;
                                });
                            });
                    });
            },
            deleteConsent: function (id) {
                return sequelize.transaction(function (tx) {
                    const ConsentSection = sequelize.models.consent_section;
                    return Consent.destroy({ where: { id } }, { transaction: tx })
                        .then(() => ConsentSection.destroy({ where: { consentId: id } }, { transaction: tx }));
                });
            },
            fillConsentDocuments: function (id) {
                return function (result) {
                    const ConsentSection = sequelize.models.consent_section;
                    const ConsentDocument = sequelize.models.consent_document;
                    return ConsentSection.findAll({ where: { consentId: id }, raw: true, attributes: ['typeId', 'line'], order: 'line' })
                        .then(sections => {
                            const typeIds = _.map(sections, 'typeId');
                            return ConsentDocument.getConsentDocumentsOfTypes(typeIds);
                        })
                        .then(sections => {
                            result.sections = sections;
                            return result;
                        });
                };
            },
            getConsentDocuments: function (id) {
                return Consent.findById(id, { raw: true, attributes: ['id', 'name'] })
                    .then(Consent.fillConsentDocuments(id));
            },
            getConsentDocumentsByName: function (name) {
                return Consent.findOne({ where: { name }, raw: true, attributes: ['id', 'name'] })
                    .then(result => {
                        const id = result.id;
                        return Consent.fillConsentDocuments(id)(result);
                    });
            },
            fillUserConsentDocuments: function (userId) {
                return function (result) {
                    const ConsentSignature = sequelize.models.consent_signature;
                    return ConsentSignature.findAll({
                            where: { userId },
                            raw: true,
                            attributes: ['consentDocumentId', 'language']
                        })
                        .then(signatures => _.keyBy(signatures, 'consentDocumentId'))
                        .then(signatures => {
                            result.sections.forEach(section => {
                                if (section) {
                                    section.signature = Boolean(signatures[section.id]);
                                    if (section.signature) {
                                        section.language = signatures[section.id].language;
                                    }
                                }
                            });
                            return result;
                        });
                };
            },
            getUserConsentDocuments: function (userId, id) {
                return Consent.getConsentDocuments(id)
                    .then(Consent.fillUserConsentDocuments(userId));
            },
            getUserConsentDocumentsByName: function (userId, name) {
                return Consent.getConsentDocumentsByName(name)
                    .then(Consent.fillUserConsentDocuments(userId));
            }
        }
    });

    return Consent;
};
