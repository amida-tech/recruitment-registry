'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

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
        return this.transaction(transaction => this.db.ConsentType.destroy({
            where: { id }, transaction,
        }));
    }

    putConsentTypeTx(id, { name, title, type, role }, options = {}, transaction) {
        const record = { name, type, role: role || null };
        return this.db.ConsentType.update(record, { where: { id }, transaction })
            .then(() => {
                const textRecord = { id, title, language: options.language || 'en' };
                return this.createTextTx(textRecord, transaction);
            });
    }

    putConsentType(id, fields, options = {}) {
        return this.transaction(tx => this.putConsentTypeTx(id, fields, options, tx));
    }
};
