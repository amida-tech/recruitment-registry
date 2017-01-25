'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const QuestionAction = db.QuestionAction;

module.exports = class QuestionActionDAO extends Translatable {
    constructor() {
        super('question_action_text', 'questionActionId');
    }

    createActionPerQuestionTx(questionId, { text, type }, line, tx) {
        const r = { questionId, type, line };
        return QuestionAction.create(r, { transaction: tx })
            .then(({ id }) => this.createTextTx({ id, text }, tx));
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
            .then(actions => this.updateAllTexts(actions, language));
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
            .then(actions => this.updateAllTexts(actions, language));
    }

    updateMultipleActionTextsTx(actions, language, tx) {
        const inputs = actions.map(({ id, text }) => ({ id, text, language }));
        return this.createMultipleTextsTx(inputs, tx);
    }
};
