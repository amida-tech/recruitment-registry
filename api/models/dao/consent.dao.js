'use strict';

const _ = require('lodash');

const db = require('../db');

const SPromise = require('../../lib/promise');

const sequelize = db.sequelize;
const Consent = db.Consent;
const ConsentSection = db.ConsentSection;
const ConsentSignature = db.ConsentSignature;

const fillSections = function (result) {
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

module.exports = class ConsentDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createConsent({ name, sections }) {
        return sequelize.transaction(tx => {
            return Consent.create({ name })
                .then(({ id }) => {
                    const consentId = id;
                    const records = sections.map((typeId, line) => ({ consentId, typeId, line }));
                    const pxs = records.map(record => ConsentSection.create(record)); // TODO: replace with bulkCreate when sequelize 4
                    return SPromise.all(pxs, { transaction: tx })
                        .then(() => ({ id }));
                });
        });
    }

    getConsent(id) {
        return Consent.findById(id, { raw: true, attributes: ['id', 'name'] })
            .then(result => fillSections(result));
    }

    getConsentByName(name) {
        return Consent.findOne({ where: { name }, raw: true, attributes: ['id', 'name'] })
            .then(result => fillSections(result));
    }

    listConsents() {
        return Consent.findAll({ raw: true, attributes: ['id', 'name'], order: 'id' })
            .then(consents => {
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
    }

    deleteConsent(id) {
        return sequelize.transaction(tx => {
            return Consent.destroy({ where: { id } }, { transaction: tx })
                .then(() => ConsentSection.destroy({ where: { consentId: id } }, { transaction: tx }));
        });
    }

    fillConsentDocuments(id, options = {}) {
        const consentDocument = this.consentDocument;
        return function (result) {
            return ConsentSection.findAll({ where: { consentId: id }, raw: true, attributes: ['typeId', 'line'], order: 'line' })
                .then(sections => {
                    const typeIds = _.map(sections, 'typeId');
                    const _options = { typeIds, typeOrder: true };
                    if (options.language) {
                        _options.language = options.language;
                    }
                    return consentDocument.listConsentDocuments(_options);
                })
                .then(sections => {
                    result.sections = sections;
                    return result;
                });
        };
    }

    getConsentDocuments(id, options) {
        return Consent.findById(id, { raw: true, attributes: ['id', 'name'] })
            .then(this.fillConsentDocuments(id, options));
    }

    getConsentDocumentsByName(name, options) {
        return Consent.findOne({ where: { name }, raw: true, attributes: ['id', 'name'] })
            .then(result => {
                const id = result.id;
                return this.fillConsentDocuments(id, options)(result);
            });
    }

    fillUserConsentDocuments(userId) {
        return function (result) {
            return ConsentSignature.findAll({
                    where: { userId },
                    raw: true,
                    attributes: ['consentDocumentId', 'language']
                })
                .then(signatures => _.keyBy(signatures, 'consentDocumentId'))
                .then(signatures => {
                    result.sections.forEach(section => {
                        section.signature = Boolean(signatures[section.id]);
                        if (section.signature) {
                            section.language = signatures[section.id].language;
                        }
                    });
                    return result;
                });
        };
    }

    getUserConsentDocuments(userId, id, options) {
        return this.getConsentDocuments(id, options)
            .then(this.fillUserConsentDocuments(userId));
    }

    getUserConsentDocumentsByName(userId, name, options) {
        return this.getConsentDocumentsByName(name, options)
            .then(this.fillUserConsentDocuments(userId));
    }
};
