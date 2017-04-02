'use strict';

const _ = require('lodash');

const queryrize = require('../../lib/queryrize');
const RRError = require('../../lib/rr-error');

const Translatable = require('./translatable');

const idFromCodeQuery = queryrize.readQuerySync('question-choice-id-from-code.sql');

module.exports = class QuestionChoiceDAO extends Translatable {
    constructor(db) {
        super(db, 'QuestionChoiceText', 'questionChoiceId');
    }

    createQuestionChoiceTx(choice, transaction) {
        const record = _.omit(choice, 'text');
        return this.db.QuestionChoice.create(record, { transaction })
            .then(({ id }) => {
                const textRecord = { id, text: choice.text };
                return this.createTextTx(textRecord, transaction)
                    .then(() => ({ id }));
            });
    }

    patchQuestionChoiceTx(id, choicePatch, transaction) {
        const record = _.omit(choicePatch, 'text');
        return this.db.QuestionChoice.update(record, { where: { id }, transaction })
            .then(() => {
                if (choicePatch.text) {
                    const textRecord = { id, text: choicePatch.text };
                    return this.createTextTx(textRecord, transaction);
                }
                return null;
            });
    }

    createQuestionChoicesTx(choices, transaction) {
        const records = choices.map((choice, line) => {
            const record = { line };
            Object.assign(record, _.omit(choice, 'text'));
            record.type = choice.type || 'bool';
            return record;
        });
        return this.db.QuestionChoice.bulkCreate(records, { transaction, returning: true })
            .then(result => result.map(({ id }) => id))
            .then((ids) => {
                const texts = choices.map(({ text }, index) => ({ text, id: ids[index] }));
                return this.createMultipleTextsTx(texts, 'en', transaction)
                    .then(() => ids);
            });
    }

    findNewQuestionChoiceLine(choice, questionId, choiceSetId, transaction) {
        if (choice.before) {
            const findOptions = { attributes: ['line'], raw: true, transaction };
            return this.db.QuestionChoice.findById(choice.before, findOptions)
                .then((record) => {
                    if (record) {
                        const line = record.line;
                        return this.shiftLines(line, questionId, choiceSetId, transaction)
                            .then(() => line);
                    }
                    return RRError.reject('qxChoiceInvalidBeforeId');
                });
        }
        const attributes = this.fnCol('max', 'question_choice', 'line');
        const where = questionId ? { questionId } : { choiceSetId };
        return this.db.QuestionChoice.findOne({ raw: true, attributes, where, transaction })
                .then(record => (record ? record.max + 1 : 0));
    }

    shiftLines(line, questionId, choiceSetId, transaction) {
        let where = questionId ? 'question_id = :questionId' : 'choice_set_id = :choiceSetId';
        where = `line >= :line AND ${where} AND deleted_at IS NULL`;
        const sql = `UPDATE ONLY question_choice SET line = line + 1 WHERE ${where}`;
        return this.query(sql, { line, questionId, choiceSetId }, transaction);
    }

    createQuestionChoice(choice) {
        const { questionId, choiceSetId } = choice;
        if (!(questionId || choiceSetId)) {
            return RRError.reject('qxChoiceNoParent');
        }
        if (questionId && choiceSetId) {
            return RRError.reject('qxChoiceMultipleParent');
        }
        return this.transaction(transaction => this.findNewQuestionChoiceLine(choice, questionId, choiceSetId, transaction)
                .then((line) => {
                    const ch = _.omit(choice, 'before');
                    ch.line = line;
                    ch.type = choice.type || (choiceSetId ? 'choice' : 'bool');
                    return this.createQuestionChoiceTx(ch, transaction);
                }));
    }

    patchQuestionChoice(id, choicePatch) {
        const { questionId, choiceSetId } = choicePatch;
        if (!(questionId || choiceSetId)) {
            return RRError.reject('qxChoiceNoParent');
        }
        if (questionId && choiceSetId) {
            return RRError.reject('qxChoiceMultipleParent');
        }
        return this.transaction((transaction) => {
            if (choicePatch.before) {
                return this.findNewQuestionChoiceLine(choicePatch, questionId, choiceSetId, transaction)
                    .then((line) => {
                        const ch = _.omit(choicePatch, 'before');
                        ch.line = line;
                        return this.patchQuestionChoiceTx(id, ch, transaction);
                    });
            }
            return this.patchQuestionChoiceTx(id, choicePatch, transaction);
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
