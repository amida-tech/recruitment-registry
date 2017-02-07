'use strict';

const _ = require('lodash');

const db = require('../db');

const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const QuestionChoice = db.QuestionChoice;

module.exports = class QuestionChoiceDAO extends Translatable {
    constructor(dependencies) {
        super('question_choice_text', 'questionChoiceId');
        Object.assign(this, dependencies);
    }

    deleteNullMeta(choices) {
        choices.forEach(choice => {
            if (!choice.meta) {
                delete choice.meta;
            }
            if (!choice.enumerationId) {
                delete choice.enumerationId;
            }
        });
        return choices;
    }

    updateEnumeration(enumeration, transaction) {
        if (enumeration) {
            return this.enumeration.getEnumerationIdByReference(enumeration, transaction);
        } else {
            return SPromise.resolve(null);
        }
    }

    createQuestionChoiceTx(choice, tx) {
        return this.updateEnumeration(choice.enumeration, tx)
            .then(enumerationId => {
                if (enumerationId) {
                    choice = _.cloneDeep(choice);
                    choice.enumerationId = enumerationId;
                }
                return QuestionChoice.create(choice, { transaction: tx })
                    .then(({ id }) => {
                        const input = { id, text: choice.text };
                        return this.createTextTx(input, tx)
                            .then(() => ({ id }));
                    });
            });
    }

    updateEnumerations(choices, language) {
        const ids = choices.reduce((r, { enumerationId }, index) => {
            if (enumerationId) {
                r.push({ enumerationId, index });
            }
            return r;
        }, []);
        if (ids.length) {
            const promises = ids.map(({ enumerationId, index }) => {
                return this.enumeral.listEnumerals(enumerationId, language)
                    .then(enumerals => enumerals.map(({ text, code }) => ({ text, code })))
                    .then(enumerals => {
                        choices[index].enumerals = enumerals;
                        delete choices[index].enumerationId;
                    });
            });
            return SPromise.all(promises).then(() => choices);
        }
        return choices;
    }

    findChoicesPerQuestion(questionId, language) {
        return QuestionChoice.findAll({
                raw: true,
                where: { questionId },
                attributes: ['id', 'type', 'meta', 'enumerationId'],
                order: 'line'
            })
            .then(choices => this.deleteNullMeta(choices))
            .then(choices => this.updateEnumerations(choices, language))
            .then(choices => this.updateAllTexts(choices, language));
    }

    getAllQuestionChoices(questionIds, language) {
        const options = {
            raw: true,
            attributes: ['id', 'type', 'questionId', 'meta', 'enumerationId'],
            order: 'line'
        };
        if (questionIds) {
            options.where = { questionId: { $in: questionIds } };
        }
        return QuestionChoice.findAll(options)
            .then(choices => this.deleteNullMeta(choices))
            .then(choices => this.updateEnumerations(choices, language))
            .then(choices => this.updateAllTexts(choices, language));
    }

    updateMultipleChoiceTextsTx(choices, language, tx) {
        const inputs = choices.map(({ id, text }) => ({ id, text, language }));
        return this.createMultipleTextsTx(inputs, tx);
    }
};
