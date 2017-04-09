'use strict';

const RRError = require('../../lib/rr-error');

const Translatable = require('./translatable');

module.exports = class ConsentTypeDAO extends Translatable {
    constructor(db) {
        super(db, 'ConsentTypeText', 'consentTypeId', ['title']);
    }

    getConsentType(id, options = {}) {
        const ConsentType = this.db.ConsentType;
        const opt = {
            raw: true,
            attributes: ['id', 'name', 'type'],
        };
        return ConsentType.findById(id, opt)
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
        const ConsentType = this.db.ConsentType;
        return ConsentType.findAll(query)
            .then(types => this.updateAllTexts(types, options.language));
    }

    createConsentType({ name, title, type }) {
        const ConsentType = this.db.ConsentType;
        return ConsentType.create({ name, type })
            .then(({ id }) => this.createText({ id, title }))
            .then(({ id }) => ({ id }));
    }

    deleteConsentType(id) {
        return this.db.ConsentSection.count({ where: { typeId: id } })
            .then((count) => {
                if (count) {
                    return RRError.reject('consentTypeDeleteOnConsent');
                }
                return this.transaction((transaction) => {
                    const where = { typeId: id };
                    return this.db.ConsentType.destroy({ where: { id }, transaction })
                        .then(() => this.db.ConsentDocument.destroy({ where, transaction }));
                });
            });
    }
};
