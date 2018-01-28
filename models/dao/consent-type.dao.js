'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const RRError = require('../../lib/rr-error');

const Translatable = require('./translatable');

const Op = Sequelize.Op;

module.exports = class ConsentTypeDAO extends Translatable {
    constructor(db) {
        super(db, 'ConsentTypeText', 'consentTypeId', ['title']);
    }

    getConsentType(id, options = {}) {
        const opt = {
            raw: true,
            attributes: ['id', 'name', 'type', 'role'],
        };
        return this.db.ConsentType.findById(id, opt)
            .then(consentType => _.omitBy(consentType, _.isNil))
            .then(consentType => this.updateText(consentType, options.language));
    }

    updateConsentTypeText({ id, title }, language) {
        return this.createText({ id, title, language });
    }

    listConsentTypes(options = {}) {
        const query = {
            raw: true,
            attributes: ['id', 'name', 'type', 'role'],
            order: ['id'],
        };
        if (options.ids) {
            query.where = { id: { [Op.in]: options.ids } };
        }
        if (options.transaction) {
            query.transaction = options.transaction;
        }
        return this.db.ConsentType.findAll(query)
            .then(types => types.map(type => _.omitBy(type, _.isNil)))
            .then(types => this.updateAllTexts(types, options.language));
    }

    createConsentType({ name, title, type, role }) {
        const record = { name, type, role: role || null };
        return this.db.ConsentType.create(record)
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
