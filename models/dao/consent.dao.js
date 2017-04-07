'use strict';

const _ = require('lodash');

const Base = require('./base');

module.exports = class ConsentDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    fillSections(result) {
        const ConsentSection = this.db.ConsentSection;
        return ConsentSection.findAll({
            where: { consentId: result.id },
            attributes: ['typeId'],
            raw: true,
            order: 'line',
        })
            .then(rawTypeIds => _.map(rawTypeIds, 'typeId'))
            .then((typeIds) => {
                result.sections = typeIds;
                return result;
            });
    }

    createConsent({ name, sections }) {
        return this.transaction((transaction) => {
            const px = this.db.Consent.create({ name }, { transaction });
            return px.then(({ id }) => {
                const consentId = id;
                const records = sections.map((typeId, line) => ({ consentId, typeId, line }));
                return this.db.ConsentSection.bulkCreate(records, { transaction })
                    .then(() => ({ id }));
            });
        });
    }

    getConsent(id) {
        const Consent = this.db.Consent;
        return Consent.findById(id, { raw: true, attributes: ['id', 'name'] })
            .then(result => this.fillSections(result));
    }

    getConsentByName(name) {
        const Consent = this.db.Consent;
        return Consent.findOne({ where: { name }, raw: true, attributes: ['id', 'name'] })
            .then(result => this.fillSections(result));
    }

    listConsents() {
        const Consent = this.db.Consent;
        const ConsentSection = this.db.ConsentSection;
        return Consent.findAll({ raw: true, attributes: ['id', 'name'], order: 'id' })
            .then(consents => ConsentSection.findAll({ raw: true, attributes: ['consentId', 'typeId', 'line'] })
                    .then(allSections => _.groupBy(allSections, 'consentId'))
                    .then(allSections => consents.map((consent) => {
                        const sections = _.sortBy(allSections[consent.id], 'line');
                        consent.sections = _.map(sections, 'typeId');
                        return consent;
                    })));
    }

    deleteConsent(id) {
        const Consent = this.db.Consent;
        const ConsentSection = this.db.ConsentSection;
        return this.transaction(transaction => Consent.destroy({ where: { id }, transaction })
                .then(() => ConsentSection.destroy({ where: { consentId: id }, transaction })));
    }

    fillConsentDocuments(id, options = {}) {
        const ConsentSection = this.db.ConsentSection;
        const consentDocument = this.consentDocument;
        return function fnFillConsentDocuments(result) {
            return ConsentSection.findAll({ where: { consentId: id }, raw: true, attributes: ['typeId', 'line'], order: 'line' })
                .then((sections) => {
                    const typeIds = _.map(sections, 'typeId');
                    const opt = { typeIds, typeOrder: true };
                    if (options.language) {
                        opt.language = options.language;
                    }
                    return consentDocument.listConsentDocuments(opt);
                })
                .then((sections) => {
                    result.sections = sections;
                    return result;
                });
        };
    }

    getConsentDocuments(id, options) {
        const Consent = this.db.Consent;
        return Consent.findById(id, { raw: true, attributes: ['id', 'name'] })
            .then(this.fillConsentDocuments(id, options));
    }

    getConsentDocumentsByName(name, options) {
        const Consent = this.db.Consent;
        return Consent.findOne({ where: { name }, raw: true, attributes: ['id', 'name'] })
            .then((result) => {
                const id = result.id;
                return this.fillConsentDocuments(id, options)(result);
            });
    }

    fillUserConsentDocuments(userId) {
        const ConsentSignature = this.db.ConsentSignature;
        return function fnFillUserConsentDocuments(result) {
            return ConsentSignature.findAll({
                where: { userId },
                raw: true,
                attributes: ['consentDocumentId', 'language'],
            })
                .then(signatures => _.keyBy(signatures, 'consentDocumentId'))
                .then((signatures) => {
                    result.sections.forEach((section) => {
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
