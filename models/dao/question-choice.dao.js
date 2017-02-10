'use strict';

const db = require('../db');

const Translatable = require('./translatable');

const QuestionChoice = db.QuestionChoice;

module.exports = class QuestionChoiceDAO extends Translatable {
    constructor(dependencies) {
        super('question_choice_text', 'questionChoiceId');
        Object.assign(this, dependencies);
    }

    deleteNullData(choices) {
        choices.forEach(choice => {
            if (!choice.meta) {
                delete choice.meta;
            }
            if (!choice.code) {
                delete choice.code;
            }
        });
        return choices;
    }

    createQuestionChoiceTx(choice, tx) {
        return QuestionChoice.create(choice, { transaction: tx })
            .then(({ id }) => {
                const input = { id, text: choice.text };
                if (choice.code) {
                    input.code = choice.code;
                }
                return this.createTextTx(input, tx)
                    .then(() => ({ id }));
            });
    }

    findChoicesPerQuestion(questionId, language) {
        return QuestionChoice.findAll({
                raw: true,
                where: { questionId },
                attributes: ['id', 'type', 'meta', 'code'],
                order: 'line'
            })
            .then(choices => this.deleteNullData(choices))
            .then(choices => this.updateAllTexts(choices, language));
    }

    getAllQuestionChoices(questionIds, language) {
        const options = {
            raw: true,
            attributes: ['id', 'type', 'questionId', 'meta', 'code'],
            order: 'line'
        };
        if (questionIds) {
            options.where = { questionId: { $in: questionIds } };
        }
        return QuestionChoice.findAll(options)
            .then(choices => this.deleteNullData(choices))
            .then(choices => this.updateAllTexts(choices, language));
    }

    updateMultipleChoiceTextsTx(choices, language, tx) {
        const inputs = choices.map(({ id, text }) => ({ id, text, language }));
        return this.createMultipleTextsTx(inputs, tx);
    }
};
