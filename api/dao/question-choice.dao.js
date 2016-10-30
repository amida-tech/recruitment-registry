'use strict';

const db = require('../models/db');

const textTableMethods = require('./text-table-methods');

const sequelize = db.sequelize;
const QuestionChoice = db.QuestionChoice;

const textHandler = textTableMethods(sequelize, 'question_choice_text', 'questionChoiceId');

module.exports = class {
	constructor() {
	}

    createQuestionChoiceTx(choice, tx) {
        return QuestionChoice.create(choice, { transaction: tx })
            .then(({ id }) => {
                const input = { id, text: choice.text };
                return textHandler.createTextTx(input, tx)
                    .then(() => ({ id }));
            });
    }

    findChoicesPerQuestion(questionId, language) {
        return QuestionChoice.findAll({
                raw: true,
                where: { questionId },
                attributes: ['id', 'type']
            })
            .then(choices => textHandler.updateAllTexts(choices, language));
    }

    getAllQuestionChoices(questionIds, language) {
        const options = {
            raw: true,
            attributes: ['id', 'type', 'questionId'],
            order: 'line'
        };
        if (questionIds) {
            options.where = { questionId: { $in: questionIds } };
        }
        return QuestionChoice.findAll(options)
            .then(choices => textHandler.updateAllTexts(choices, language));
    }

    updateMultipleChoiceTextsTx(choices, language, tx) {
        const inputs = choices.map(({ id, text }) => ({ id, text, language }));
        return textHandler.createMultipleTextsTx(inputs, tx);
    }
};
