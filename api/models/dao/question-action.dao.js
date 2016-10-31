'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const textTableMethods = require('./text-table-methods');

const sequelize = db.sequelize;
const QuestionAction = db.QuestionAction;

const textHandler = textTableMethods(sequelize, 'question_action_text', 'questionActionId');

module.exports = class {
    constructor() {}

    createActionPerQuestionTx(questionId, { text, type }, line, tx) {
        const r = { questionId, type, line };
        return QuestionAction.create(r, { transaction: tx })
            .then(({ id }) => textHandler.createTextTx({ id, text }, tx));
    }

    createActionsPerQuestionTx(questionId, actions, tx) {
        return SPromise.all(actions.map((action, index) => {
            return this.createActionPerQuestionTx(questionId, action, index, tx);
        }));
    }

    findActionsPerQuestion(questionId, language) {
        return QuestionAction.findAll({
                raw: true,
                where: { questionId },
                attributes: ['id', 'type'],
                order: 'line'
            })
            .then(actions => textHandler.updateAllTexts(actions, language));
    }

    findActionsPerQuestions(ids, language) {
        const options = {
            raw: true,
            attributes: ['id', 'type', 'questionId'],
            order: 'line'
        };
        if (ids) {
            options.where = { questionId: { $in: ids } };
        }
        return QuestionAction.findAll(options)
            .then(actions => textHandler.updateAllTexts(actions, language));
    }

    updateMultipleActionTextsTx(actions, language, tx) {
        const inputs = actions.map(({ id, text }) => ({ id, text, language }));
        return textHandler.createMultipleTextsTx(inputs, tx);
    }
};
