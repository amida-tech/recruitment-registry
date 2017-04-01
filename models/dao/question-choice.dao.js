'use strict';

const _ = require('lodash');

const SPromise = require('../../lib/promise');
const queryrize = require('../../lib/queryrize');
const RRError = require('../../lib/rr-error');

const Translatable = require('./translatable');

const idFromCodeQuery = queryrize.readQuerySync('question-choice-id-from-code.sql');

module.exports = class QuestionChoiceDAO extends Translatable {
    constructor(db) {
        super(db, 'QuestionChoiceText', 'questionChoiceId');
    }

    createQuestionChoiceTx(choice, transaction) {
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.create(choice, { transaction })
            .then(({ id }) => {
                const input = { id, text: choice.text };
                return this.createTextTx(input, transaction)
                    .then(() => ({ id }));
            });
    }

    findChoicesPerQuestion(questionId, language) {
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.findAll({
            raw: true,
            where: { questionId },
            attributes: ['id', 'type', 'meta', 'code'],
            order: 'line',
        })
            .then(choices => choices.map(choice => _.omitBy(choice, _.isNil)))
            .then(choices => this.updateAllTexts(choices, language));
    }

    getAllQuestionChoices(questionIds, language) {
        const options = {
            raw: true,
            attributes: ['id', 'type', 'questionId', 'meta', 'code'],
            order: 'line',
        };
        if (questionIds) {
            options.where = { questionId: { $in: questionIds } };
        }
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.findAll(options)
            .then(choices => choices.map(choice => _.omitBy(choice, _.isNil)))
            .then(choices => this.updateAllTexts(choices, language));
    }

    getAllChoiceSetChoices(choiceSetIds, language) {
        const options = {
            raw: true,
            attributes: ['id', 'type', 'choiceSetId', 'meta', 'code'],
            order: ['choiceSetId', 'line'],
        };
        if (choiceSetIds) {
            options.where = { questionId: { $in: choiceSetIds } };
        }
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.findAll(options)
            .then(choices => choices.map(choice => _.omitBy(choice, _.isNil)))
            .then(choices => this.updateAllTexts(choices, language));
    }

    createQuestionChoices(choiceSetId, choices, transaction) {
        const type = 'choice';
        const promises = choices.map(({ code, text }, line) => this.createQuestionChoiceTx({ choiceSetId, text, code, line, type }, transaction));
        return SPromise.all(promises);
    }

    updateMultipleChoiceTexts(choices, language) {
        return this.transaction(transaction => this.createMultipleTextsTx(choices, language, transaction));
    }

    listQuestionChoices(choiceSetId, language) {
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.findAll({ where: { choiceSetId }, raw: true, attributes: ['id', 'code'], order: 'line' })
            .then(choices => this.updateAllTexts(choices, language));
    }

    deleteAllQuestionChoices(choiceSetId, transaction) {
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.destroy({ where: { choiceSetId }, transaction });
    }

    deleteQuestionChoice(id) {
        return this.db.Answer.count({ where: { questionChoiceId: id } })
            .then((count) => {
                if (count > 0) {
                    return RRError.reject('qxChoiceNoDeleteAnswered');
                }
                return null;
            })
            .then(() => this.db.FilterAnswer.count({ where: { questionChoiceId: id } }))
            .then((count) => {
                if (count > 0) {
                    return RRError.reject('qxChoiceNoDeleteInFilter');
                }
                return null;
            })
            .then(() => this.db.QuestionChoice.destroy({ where: { id } }));
    }

    findQuestionChoiceIdForCode(questionId, code, transaction) {
        const replacements = { question_id: questionId, code };
        return this.selectQuery(idFromCodeQuery, replacements, transaction)
            .then((result) => {
                if (result && result.length) {
                    return result[0].id;
                }
                return RRError.reject('questionChoiceCodeNotFound');
            });
    }
};
