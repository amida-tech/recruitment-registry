'use strict';

const db = require('../db');

const RRError = require('../../lib/rr-error');

const Translatable = require('./translatable');

const sequelize = db.sequelize;
const ConsentType = db.ConsentType;
const ConsentSection = db.ConsentSection;
const ConsentDocument = db.ConsentDocument;

module.exports = class ConsentTypeDAO extends Translatable {
    constructor() {
        super('consent_type_text', 'consentTypeId', ['title']);
    }

    getConsentType(id, options = {}) {
        const _options = {
            raw: true,
            attributes: ['id', 'name', 'type'],
        };
        return ConsentType.findById(id, _options)
            .then(consentType => this.updateText(consentType, options.language));
    }

    updateConsentTypeText({ id, title }, language) {
        return this.createText({ id, title, language });
    }

    listConsentTypes(options = {}) {
        const query = {
            raw: true,
            attributes: ['id', 'name', 'type'],
            order: 'id',
        };
        if (options.ids) {
            query.where = { id: { $in: options.ids } };
        }
        if (options.transaction) {
            query.transaction = options.transaction;
        }
        return ConsentType.findAll(query)
            .then(types => this.updateAllTexts(types, options.language));
    }

    createConsentType({ name, title, type }) {
        return ConsentType.create({ name, type })
            .then(({ id }) => this.createText({ id, title }))
            .then(({ id }) => ({ id }));
    }

    deleteConsentType(id) {
        return ConsentSection.count({ where: { typeId: id } })
            .then((count) => {
                if (count) {
                    return RRError.reject('consentTypeDeleteOnConsent');
                }
                return sequelize.transaction(transaction => ConsentType.destroy({ where: { id }, transaction })
                            .then(() => ConsentDocument.destroy({ where: { typeId: id }, transaction })));
            });
    }
};
