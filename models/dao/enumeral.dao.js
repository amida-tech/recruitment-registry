'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const QuestionChoice = db.QuestionChoice;

module.exports = class EnumeralDAO extends Translatable {
    constructor() {
        super('question_choice_text', 'questionChoiceId');
    }

    createEnumerals(enumerationId, enumerals, transaction) {
        const type = 'choice';
        const promises = enumerals.map(({ code, text }, line) => {
            return QuestionChoice.create({ enumerationId, code, line, type }, { transaction })
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
        return QuestionChoice.findAll({ where: { enumerationId }, raw: true, attributes: ['id', 'code'], order: 'line' })
            .then(enumerals => this.updateAllTexts(enumerals, language));
    }

    deleteAllEnumerals(enumerationId, transaction) {
        return QuestionChoice.destroy({ where: { enumerationId }, transaction });
    }

    deleteEnumeral(id) {
        return QuestionChoice.destroy({ where: { id } });
    }
};
