'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const queryrize = require('../../lib/queryrize');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const Op = Sequelize.Op;

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

    createQuestionChoicesTx(choices, transaction, language = 'en') {
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
                return this.createMultipleTextsTx(texts, language, transaction)
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
        return this.transaction(transaction => this.findNewQuestionChoiceLine(choice, questionId, choiceSetId, transaction)   // eslint-disable-line max-len
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
                return this.findNewQuestionChoiceLine(choicePatch, questionId, choiceSetId, transaction)   // eslint-disable-line max-len
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
            order: ['line'],
        })
            .then(choices => choices.map(choice => _.omitBy(choice, _.isNil)))
            .then(choices => this.updateAllTexts(choices, language));
    }

    getAllQuestionChoices(questionIds, language) {
        const options = {
            raw: true,
            attributes: ['id', 'type', 'questionId', 'meta', 'code'],
            order: ['line'],
        };
        if (questionIds) {
            options.where = { questionId: { [Op.in]: questionIds } };
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
            options.where = { questionId: { [Op.in]: choiceSetIds } };
        }
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.findAll(options)
            .then(choices => choices.map(choice => _.omitBy(choice, _.isNil)))
            .then(choices => this.updateAllTexts(choices, language));
    }

    updateMultipleChoiceTexts(choices, language) {
        return this.transaction(tx => this.createMultipleTextsTx(choices, language, tx));
    }

    listQuestionChoices(choiceSetId, language) {
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.findAll({ where: { choiceSetId }, raw: true, attributes: ['id', 'code'], order: ['line'] })
            .then(choices => this.updateAllTexts(choices, language));
    }

    deleteAllQuestionChoices(choiceSetId, transaction) {
        const QuestionChoice = this.db.QuestionChoice;
        return QuestionChoice.destroy({ where: { choiceSetId }, transaction });
    }

    validateForDelete(ids, force, transaction) {
        if (force) {
            return SPromise.resolve();
        }
        const where = { where: { questionChoiceId: { [Op.in]: ids } } };
        if (transaction) {
            where.transaction = transaction;
        }
        return this.db.Answer.count(where)
            .then((count) => {
                if (count > 0) {
                    return RRError.reject('qxChoiceNoDeleteAnswered');
                }
                return null;
            })
            .then(() => this.db.FilterAnswer.count(where))
            .then((count) => {
                if (count > 0) {
                    return RRError.reject('qxChoiceNoDeleteInFilter');
                }
                return null;
            })
            .then(() => this.db.AnswerRuleValue.count(where))
            .then((count) => {
                if (count > 0) {
                    return RRError.reject('qxChoiceNoDeleteInEnableWhen');
                }
                return null;
            });
    }

    deleteQuestionChoicesTx(ids, force, transaction) {
        const where = { where: { questionChoiceId: { [Op.in]: ids } }, transaction };
        return this.validateForDelete(ids, force, transaction)
            .then(() => this.db.Answer.destroy(where))          // TODO V
            .then(() => this.db.FilterAnswer.destroy(where))    // Empty filters should be removed
            .then(() => this.db.AnswerRuleValue.destroy(where)) // Empty rules should be removed
            .then(() => this.db.AnswerIdentifier.destroy(where))
            .then(() => this.db.QuestionChoiceText.destroy(where))
            .then(() => {
                const options = { where: { id: { [Op.in]: ids } }, transaction };
                return this.db.QuestionChoice.destroy(options);
            });
    }

    deleteQuestionChoice(id) {
        return this.validateForDelete([id])
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

    updateForMatchedQuestionChoices(matchedChoices, language, transaction) {
        const { textUpdates, baseUpdates } = matchedChoices.reduce((r, { choice, patch }) => {
            if (choice.text !== patch.text) {
                r.textUpdates.push({ id: patch.id, text: patch.text });
            }
            const textlessChoice = _.omit(choice, 'text');
            const textlessPatch = _.omit(patch, 'text');
            if (!_.isEqual(textlessPatch, textlessChoice)) {
                const update = { id: patch.id };
                ['meta', 'code', 'line'].forEach((field) => {
                    let value = patch[field];
                    if (value === undefined) {
                        value = null;
                    }
                    update[field] = value;
                });
                r.baseUpdates.push({ id: patch.id, update });
            }
            return r;
        }, { textUpdates: [], baseUpdates: [] });
        return SPromise.resolve()
            .then(() => {
                if (textUpdates.length) {
                    return this.createMultipleTextsTx(textUpdates, language, transaction);
                }
                return null;
            })
            .then(() => {
                if (baseUpdates.length) {
                    const pxs = baseUpdates.map(({ id, update }) => {
                        const options = { where: { id }, transaction };
                        return this.db.QuestionChoice.update(update, options);
                    });
                    return SPromise.all(pxs);
                }
                return null;
            });
    }

    patchChoicesForQuestion(questionId, choices, choicesPatch, transaction, options) {
        const choiceMap = (choices || []).reduce((r, choice, line) => {
            const record = Object.assign({ line }, choice);
            r[choice.id] = record;
            return r;
        }, {});

        const {
            newChoices,
            changedChoices,
            choicesPatchMap,
        } = (choicesPatch || []).reduce((r, choicePatch, line) => {
            const id = choicePatch.id;
            const record = Object.assign({ line }, choicePatch);
            if (id) {
                const choice = choiceMap[id];
                if (!choice) {
                    throw new RRError('qxChoicePatchInvalidId', id);
                }
                if (choice.type !== record.type) {
                    throw new RRError('qxChoicePatchNoTypeChange');
                }
                r.choicesPatchMap[id] = record;
                if (_.isEqual(choice, record)) {
                    return r;
                }
                r.changedChoices.push({ choice, patch: record });
                return r;
            }
            r.newChoices.push(Object.assign(record, { questionId }));
            return r;
        }, { newChoices: [], changedChoices: [], choicesPatchMap: {} });

        const deletedIds = (choices || []).reduce((r, choice) => {
            const id = choice.id;
            if (!choicesPatchMap[id]) {
                r.push(id);
            }
            return r;
        }, []);

        const language = options.language || 'en';
        return SPromise.resolve()
            .then(() => {
                if (!deletedIds.length) {
                    return null;
                }
                return this.deleteQuestionChoicesTx(deletedIds, options.force, transaction);
            })
            .then(() => {
                if (!changedChoices.length) {
                    return null;
                }
                return this.updateForMatchedQuestionChoices(changedChoices, language, transaction);
            })
            .then(() => {
                if (!newChoices.length) {
                    return null;
                }
                return this.createQuestionChoicesTx(newChoices, transaction, language)
                    .then((ids) => {
                        newChoices.forEach((r, index) => Object.assign(r, { id: ids[index] }));
                    });
            })
            .then(() => ({ deletedIds, newChoices }));
    }
};
