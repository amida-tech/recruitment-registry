'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const Enumeral = db.Enumeral;

module.exports = class EnumeralDAO extends Translatable {
    constructor() {
        super('enumeral_text', 'enumeralId');
    }

    createEnumerals(enumerationId, enumerals, transaction) {
        const promises = enumerals.map(({ value, text }, line) => {
            return Enumeral.create({ enumerationId, value, line }, { transaction })
                .then(({ id }) => {
                    return this.createTextTx({ id, text }, transaction)
                        .then(({ id }) => ({ id }));
                });
        });
        return SPromise.all(promises);
    }

    updateEnumeralTexts(translations, language) {
        const input = translations.map(({ id, text }) => ({ id, text, language }));
        return this.createMultipleTexts(input);
    }

    listEnumerals(enumerationId, language) {
        return Enumeral.findAll({ where: { enumerationId }, raw: true, attributes: ['id', 'value'], order: 'line' })
            .then(enumerals => this.updateAllTexts(enumerals, language));
    }

    deleteAllEnumerals(enumerationId, transaction) {
        return Enumeral.destroy({ where: { enumerationId }, transaction });
    }

    deleteEnumeral(id) {
        return Enumeral.destroy({ where: { id } });
    }
};
