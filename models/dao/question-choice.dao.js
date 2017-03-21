'use strict';

const SPromise = require('../../lib/promise');
const queryrize = require('../../lib/queryrize');
const RRError = require('../../lib/rr-error');

const Translatable = require('./translatable');

const idFromCodeQuery = queryrize.readQuerySync('question-choice-id-from-code.sql');

module.exports = class QuestionChoiceDAO extends Translatable {
    constructor(db) {
        super(db, 'question_choice_text', 'questionChoiceId');
    }

    deleteNullData(choices) {
        choices.forEach((choice) => {
            if (!choice.meta) {
                delete choice.meta;
            }
            if (!choice.code) {
                delete choice.code;
            }
        });
        return choices;
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
            .then(choices => this.deleteNullData(choices))
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
            .then(choices => this.deleteNullData(choices))
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
            .then(choices => this.deleteNullData(choices))
            .then(choices => this.updateAllTexts(choices, language));
    }

    updateMultipleChoiceTextsTx(choices, language, transaction) {
        const inputs = choices.map(({ id, text }) => ({ id, text, language }));
        return this.createMultipleTextsTx(inputs, transaction);
    }

    createQuestionChoices(choiceSetId, choices, transaction) {
        const type = 'choice';
        const promises = choices.map(({ code, text }, line) => this.createQuestionChoiceTx({ choiceSetId, text, code, line, type }, transaction));
        return SPromise.all(promises);
    }

    updateMultipleChoiceTexts(choices, language) {
        const sequelize = this.db.sequelize;
        return sequelize.transaction(transaction => this.updateMultipleChoiceTextsTx(choices, language, transaction));
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
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.destroy({ where: { id } });
    }

    findQuestionChoiceIdForCode(questionId, code, transaction) {
        const sequelize = this.db.sequelize;
        return sequelize.query(idFromCodeQuery, {
            type: sequelize.QueryTypes.SELECT,
            replacements: { question_id: questionId, code },
            transaction,
        })
            .then((result) => {
                if (result && result.length) {
                    return result[0].id;
                }
                return RRError.reject('questionChoiceCodeNotFound');
            });
    }
};
