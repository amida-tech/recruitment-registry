'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const Translatable = require('./translatable');
const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

const sequelize = db.sequelize;
const SurveyQuestion = db.SurveyQuestion;
const Question = db.Question;
const QuestionIdentifier = db.QuestionIdentifier;
const AnswerIdentifier = db.AnswerIdentifier;

module.exports = class QuestionDAO extends Translatable {
    constructor(dependencies) {
        super('question_text', 'questionId', ['text', 'instruction'], { instruction: true });
        Object.assign(this, dependencies);
    }

    createChoicesTx(questionId, choices, transaction) {
        const pxs = choices.map(({ text, code, type, meta, answerIdentifier }, line) => {
            type = type || 'bool';
            const choice = { questionId, text, type, line };
            if (meta) {
                choice.meta = meta;
            }
            if (code) {
                choice.code = code;
            }
            return this.questionChoice.createQuestionChoiceTx(choice, transaction)
                .then(({ id }) => {
                    if (answerIdentifier) {
                        const { type, value: identifier } = answerIdentifier;
                        const questionChoiceId = id;
                        return this.answerIdentifier.createAnswerIdentifier({ type, identifier, questionId, questionChoiceId }, transaction)
                            .then(() => ({ id }));
                    }
                    return { id };
                })
                .then(({ id }) => {
                    const result = { id, text: choice.text };
                    if (meta) {
                        result.meta = meta;
                    }
                    if (code) {
                        choice.code = code;
                    }
                    return result;
                });
        });
        return SPromise.all(pxs);
    }

    updateChoiceSetReference(choiceSetReference, transaction) {
        if (choiceSetReference) {
            return this.choiceSet.getChoiceSetIdByReference(choiceSetReference, transaction);
        }
        return SPromise.resolve(null);
    }

    createQuestionTx(question, transaction) {
        return this.updateChoiceSetReference(question.choiceSetReference, transaction)
            .then((choiceSetId) => {
                const baseFields = _.omit(question, ['oneOfChoices', 'choices', 'actions']);
                if (choiceSetId) {
                    baseFields.choiceSetId = choiceSetId;
                }
                return Question.create(baseFields, { transaction, raw: true })
                    .then((result) => {
                        const { text, instruction } = question;
                        const id = result.id;
                        return this.createTextTx({ text, instruction, id }, transaction)
                            .then(() => {
                                const oneOfChoices = question.oneOfChoices;
                                let choices = question.choices;
                                const nOneOfChoices = (oneOfChoices && oneOfChoices.length) || 0;
                                const nChoices = (choices && choices.length) || 0;
                                if (nOneOfChoices || nChoices) {
                                    if (nOneOfChoices) {
                                        choices = oneOfChoices.map(text => ({ text, type: 'bool' }));
                                    }
                                    return this.createChoicesTx(result.id, choices, transaction)
                                        .then(choices => (result.choices = choices));
                                }
                                return null;
                            })
                            .then(() => {
                                if (question.questionIdentifier) {
                                    const questionId = result.id;
                                    const { type, value: identifier } = question.questionIdentifier;
                                    return this.questionIdentifier.createQuestionIdentifier({ type, identifier, questionId }, transaction);
                                }
                                return null;
                            })
                            .then(() => {
                                const questionId = result.id;
                                if (question.answerIdentifier) {
                                    const { type, value: identifier } = question.answerIdentifier;
                                    return this.answerIdentifier.createAnswerIdentifier({ type, identifier, questionId }, transaction);
                                } else if (question.answerIdentifiers) {
                                    const { type, values } = question.answerIdentifiers;
                                    const promises = values.map((identifier, multipleIndex) => this.answerIdentifier.createAnswerIdentifier({ type, identifier, questionId, multipleIndex }, transaction));
                                    return SPromise.all(promises);
                                }
                                return null;
                            })
                            .then(() => result);
                    });
            });
    }

    createQuestion(question) {
        return sequelize.transaction(transaction => this.createQuestionTx(question, transaction));
    }

    replaceQuestion(id, replacement) {
        return SurveyQuestion.count({ where: { questionId: id } })
            .then((count) => {
                if (count) {
                    return RRError.reject('qxReplaceWhenActiveSurveys');
                }
                return sequelize.transaction(transaction => Question.findById(id, { transaction })
                            .then((question) => {
                                if (!question) {
                                    return RRError.reject('qxNotFound');
                                }
                                const version = question.version || 1;
                                const newQuestion = Object.assign({}, replacement, {
                                    version: version + 1,
                                    groupId: question.groupId || question.id,
                                });
                                return this.createQuestionTx(newQuestion, transaction)
                                    .then(({ id }) => {
                                        if (!question.groupId) {
                                            return question.update({ version: 1, groupId: question.id }, { transaction })
                                                .then(() => id);
                                        }
                                        return id;
                                    })
                                    .then(id => question.destroy({ transaction })
                                            .then(() => SurveyQuestion.destroy({ where: { questionId: question.id } }))
                                            .then(() => ({ id })));
                            }));
            });
    }

    getQuestion(id, options = {}) {
        const language = options.language;
        return Question.findById(id, { raw: true, attributes: ['id', 'type', 'meta', 'multiple', 'maxCount', 'choiceSetId'] })
            .then((question) => {
                if (!question) {
                    return RRError.reject('qxNotFound');
                }
                if (question.meta === null) {
                    delete question.meta;
                }
                if (question.maxCount === null) {
                    delete question.maxCount;
                }
                if (question.multiple === null) {
                    delete question.multiple;
                }
                if (question.choiceSetId === null) {
                    delete question.choiceSetId;
                }
                return question;
            })
            .then((question) => {
                if (question.choiceSetId) {
                    return this.questionChoice.listQuestionChoices(question.choiceSetId, language)
                        .then((choices) => {
                            question.choices = choices.map(({ id, text, code }) => ({ id, text, code }));
                            delete question.choiceSetId;
                            return question;
                        });
                }
                return question;
            })
            .then(question => this.updateText(question, language))
            .then((question) => {
                if (['choice', 'choices'].indexOf(question.type) < 0) {
                    return question;
                }
                return this.questionChoice.findChoicesPerQuestion(question.id, options.language)
                    .then((choices) => {
                        if (question.type === 'choice') {
                            choices.forEach(choice => delete choice.type);
                        }
                        question.choices = choices;
                        return question;
                    });
            });
    }

    auxUpdateQuestionTextTx({ id, text, instruction }, language, tx) {
        if (text) {
            return this.createTextTx({ id, text, instruction, language }, tx);
        }
        return SPromise.resolve();
    }

    updateQuestionTextTx(translation, language, tx) {
        return this.auxUpdateQuestionTextTx(translation, language, tx)
            .then(() => {
                const choices = translation.choices;
                if (choices) {
                    return this.questionChoice.updateMultipleChoiceTextsTx(choices, language, tx);
                }
                return null;
            });
    }

    updateQuestionText(translation, language) {
        return sequelize.transaction(tx => this.updateQuestionTextTx(translation, language, tx));
    }

    deleteQuestion(id) {
        return SurveyQuestion.count({ where: { questionId: id } })
            .then((count) => {
                if (count) {
                    return RRError.reject('qxReplaceWhenActiveSurveys');
                }
                return Question.destroy({ where: { id } })
                        .then(() => SurveyQuestion.destroy({ where: { questionId: id } }));
            });
    }

    listQuestions({ scope, ids, language } = {}) {
        scope = scope || 'summary';
        const attributes = ['id', 'type'];
        if (scope === 'complete' || scope === 'export') {
            attributes.push('meta', 'multiple', 'maxCount', 'choiceSetId');
        }
        const options = { raw: true, attributes, order: 'id' };
        if (ids) {
            options.where = { id: { $in: ids } };
        }
        return Question.findAll(options)
            .then((questions) => {
                if (ids && (questions.length !== ids.length)) {
                    return RRError.reject('qxNotFound');
                }
                if (!questions.length) {
                    return questions;
                }
                const map = new Map(questions.map(question => ([question.id, question])));
                if (ids) {
                    questions = ids.map(id => map.get(id)); // order by specified ids
                }
                questions.forEach((question) => {
                    if (question.meta === null) {
                        delete question.meta;
                    }
                    if (question.maxCount === null) {
                        delete question.maxCount;
                    }
                    if (question.multiple === null) {
                        delete question.multiple;
                    }
                    if (question.choiceSetId === null) {
                        delete question.choiceSetId;
                    }
                });
                return this.updateAllTexts(questions, language)
                    .then(() => {
                        const promises = questions.reduce((r, question) => {
                            if (question.choiceSetId) {
                                const promise = this.questionChoice.listQuestionChoices(question.choiceSetId, language)
                                    .then((choices) => {
                                        question.choices = choices.map(({ id, text, code }) => ({ id, text, code }));
                                        delete question.choiceSetId;
                                    });
                                r.push(promise);
                            }
                            return r;
                        }, []);
                        return SPromise.all(promises);
                    })
                    .then(() => {
                        if (scope !== 'summary') {
                            return this.questionChoice.getAllQuestionChoices(ids, language)
                                .then((choices) => {
                                    choices.forEach((choice) => {
                                        const q = map.get(choice.questionId);
                                        if (q) {
                                            delete choice.questionId;
                                            if (q.type === 'choice' || q.type === 'choice-ref') {
                                                delete choice.type;
                                            }
                                            if (q.choices) {
                                                q.choices.push(choice);
                                            } else {
                                                q.choices = [choice];
                                            }
                                        }
                                    });
                                });
                        }
                        return null;
                    })
                    .then(() => questions);
            });
    }

    addQuestionIdentifiersTx(questionId, allIdentifiers, transaction) {
        const { type, identifier, answerIdentifier, choices } = allIdentifiers;
        return QuestionIdentifier.create({ type, identifier, questionId }, { transaction })
            .then(() => {
                if (answerIdentifier) {
                    return AnswerIdentifier.create({ type, identifier: answerIdentifier, questionId }, { transaction });
                }
                const pxs = choices.map(({ answerIdentifier: identifier, id: questionChoiceId }) => AnswerIdentifier.create({ type, identifier, questionId, questionChoiceId }, { transaction }));
                return SPromise.all(pxs);
            });
    }

    addQuestionIdentifiers(questionId, allIdentifiers) {
        return sequelize.transaction(transaction => this.addQuestionIdentifiersTx(questionId, allIdentifiers, transaction));
    }

    exportMetaQuestionProperties(meta, metaOptions, withChoice, fromQuestion) {
        return metaOptions.reduce((r, propertyInfo) => {
            if (fromQuestion && withChoice) {
                return r;
            }
            const name = propertyInfo.name;
            if (Object.prototype.hasOwnProperty.call(meta, name)) {
                r[name] = meta[name];
            }
            return r;
        }, {});
    }

    export(options = {}) {
        return this.listQuestions({ scope: 'export' })
            .then(questions => questions.reduce((r, { id, type, text, instruction, meta, choices }) => {
                const questionLine = { id, type, text, instruction };
                if (meta && options.meta) {
                    Object.assign(questionLine, this.exportMetaQuestionProperties(meta, options.meta, choices, true));
                }
                if (!choices) {
                    r.push(questionLine);
                    return r;
                }
                choices.forEach(({ id, type, text, code, meta }, index) => {
                    const line = { choiceId: id, choiceText: text };
                    if (type) {
                        line.choiceType = type;
                    }
                    if (code) {
                        line.choiceCode = code;
                    }
                    if (meta && options.meta) {
                        Object.assign(questionLine, this.exportMetaQuestionProperties(meta, options.meta, true, false));
                    }
                    if (index === 0) {
                        Object.assign(line, questionLine);
                    } else {
                        line.id = questionLine.id;
                    }
                    r.push(line);
                });
                return r;
            }, []))
            .then((lines) => {
                const converter = new ExportCSVConverter();
                return converter.dataToCSV(lines);
            });
    }

    importMetaQuestionProperties(record, metaOptions, fromType) {
        return metaOptions.reduce((r, propertyInfo) => {
            if (propertyInfo.type === fromType) {
                const name = propertyInfo.name;
                const value = record[name];
                if (value !== undefined && value !== null) {
                    r[name] = value;
                }
            }
            return r;
        }, {});
    }

    import(stream, options = {}) {
        const converter = new ImportCSVConverter();
        return converter.streamToRecords(stream)
            .then((records) => {
                const numRecords = records.length;
                if (!numRecords) {
                    return [];
                }
                const map = records.reduce((r, record) => {
                    const id = record.id;
                    let { question } = r.get(id) || {};
                    if (!question) {
                        question = { text: record.text, type: record.type, key: record.key };
                        if (record.instruction) {
                            question.instruction = record.instruction;
                        }
                        if (options.meta) {
                            const meta = this.importMetaQuestionProperties(record, options.meta, 'question');
                            if (Object.keys(meta).length > 0) {
                                question.meta = meta;
                            }
                        }
                        if (!record.choiceId) {
                            question.answerKey = record.answerKey;
                            question.tag = record.tag;
                        }
                        r.set(id, { id, question });
                    }
                    if (record.choiceId) {
                        if (!question.choices) {
                            question.choices = [];
                        }
                        const choice = { id: record.choiceId, text: record.choiceText };
                        if (record.choiceType) {
                            choice.type = record.choiceType;
                        }
                        if (record.choiceCode) {
                            choice.code = record.choiceCode;
                        }
                        if (options.meta) {
                            const meta = this.importMetaQuestionProperties(record, options.meta, 'choice');
                            if (Object.keys(meta).length > 0) {
                                choice.meta = meta;
                            }
                        }
                        choice.answerKey = record.answerKey;
                        choice.tag = record.tag;
                        question.choices.push(choice);
                    }
                    return r;
                }, new Map());
                return [...map.values()];
            })
            .then((records) => {
                if (!records.length) {
                    return {};
                }
                return sequelize.transaction((transaction) => {
                    const mapIds = {};
                    const pxs = records.map(({ id, question }) => {
                        const questionProper = _.omit(question, ['choices', 'key', 'answerKey', 'tag']);
                        return this.createQuestionTx(questionProper, transaction)
                            .then(({ id: questionId }) => {
                                const type = options.sourceType;
                                const identifier = question.key;
                                if (type && identifier) {
                                    return QuestionIdentifier.create({ type, identifier, questionId }, { transaction })
                                        .then(() => {
                                            if (!question.choices) {
                                                const identifier = question.answerKey;
                                                const tag = parseInt(question.tag, 10);
                                                return AnswerIdentifier.create({ type, identifier, questionId, tag }, { transaction });
                                            }
                                            return null;
                                        })
                                        .then(() => questionId);
                                }
                                return questionId;
                            })
                            .then((questionId) => {
                                const choices = question.choices;
                                if (choices) {
                                    const inputChoices = choices.map(choice => _.omit(choice, ['id', 'answerKey', 'tag']));
                                    return this.createChoicesTx(questionId, inputChoices, transaction)
                                        .then(choicesIds => choicesIds.map(choicesId => choicesId.id))
                                        .then((choicesIds) => {
                                            const type = options.sourceType;
                                            if (type) {
                                                const pxs = choicesIds.map((questionChoiceId, index) => {
                                                    const identifier = choices[index].answerKey;
                                                    const tag = parseInt(choices[index].tag, 10);
                                                    return AnswerIdentifier.create({ type, identifier, questionId, questionChoiceId, tag }, { transaction });
                                                });
                                                return SPromise.all(pxs)
                                                    .then(() => choicesIds);
                                            }
                                            return choicesIds;
                                        })
                                        .then((choicesIds) => {
                                            mapIds[id] = {
                                                questionId,
                                                choicesIds: _.zipObject(choices.map(choice => choice.id), choicesIds),
                                            };
                                        });
                                }
                                mapIds[id] = { questionId };
                                return null;
                            });
                    });
                    return SPromise.all(pxs).then(() => mapIds);
                });
            });
    }
};
