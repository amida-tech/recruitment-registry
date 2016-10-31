'use strict';

const db = require('../db');

const RRError = require('../../lib/rr-error');

const textTableMethods = require('./text-table-methods');

const sequelize = db.sequelize;
const ConsentType = db.ConsentType;
const ConsentSection = db.ConsentSection;
const ConsentDocument = db.ConsentDocument;

const textHandler = textTableMethods(sequelize, 'consent_type_text', 'consentTypeId', ['title']);

module.exports = class {
    constructor() {}

    getConsentType(id, options = {}) {
        const _options = {
            raw: true,
            attributes: ['id', 'name', 'type']
        };
        return ConsentType.findById(id, _options)
            .then(consentType => textHandler.updateText(consentType, options.language));
    }

    updateConsentTypeText({ id, title }, language) {
        return textHandler.createText({ id, title, language });
    }

    listConsentTypes(options = {}) {
        const query = {
            raw: true,
            attributes: ['id', 'name', 'type'],
            order: 'id'
        };
        if (options.ids) {
            query.where = { id: { $in: options.ids } };
        }
        if (options.transaction) {
            query.transaction = options.transaction;
        }
        return ConsentType.findAll(query)
            .then(types => textHandler.updateAllTexts(types, options.language));
    }

    createConsentType({ name, title, type }) {
        return ConsentType.create({ name, type })
            .then(({ id }) => textHandler.createText({ id, title }))
            .then(({ id }) => ({ id }));
    }

    deleteConsentType(id) {
        return ConsentSection.count({ where: { typeId: id } })
            .then(count => {
                if (count) {
                    return RRError.reject('consentTypeDeleteOnConsent');
                } else {
                    return sequelize.transaction(tx => {
                        return ConsentType.destroy({ where: { id }, transaction: tx })
                            .then(() => ConsentDocument.destroy({
                                where: { typeId: id }
                            }, { transaction: tx }));
                    });
                }
            });
    }
};
