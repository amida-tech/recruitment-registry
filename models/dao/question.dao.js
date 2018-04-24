'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const Translatable = require('./translatable');
const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

const Op = Sequelize.Op;

const choiceTypes = ['choice', 'open-choice', 'choices'];

const isDirectChoiceType = function (question) {
    return choiceTypes.indexOf(question.type) >= 0;
};

const cleanDBQuestion = function (question) {
    const result = _.omitBy(question, _.isNil);
    if (question.common === null) {
        result.common = false;
    }
    if (result.type === 'scale' && result.parameter) {
        const limits = question.parameter.split(':');
        const scaleLimits = {};
        if (limits[0]) {
            scaleLimits.min = parseFloat(limits[0]);
        }
        if (limits[1]) {
            scaleLimits.max = parseFloat(limits[1]);
        }
        Object.assign(result, { scaleLimits });
        delete result.parameter;
    }
    return result;
};

const parameterJsonToString = function (question) {
    const scaleLimits = question.scaleLimits;
    if (scaleLimits) {
        const min = scaleLimits.min === undefined ? '' : scaleLimits.min;
        const max = scaleLimits.max === undefined ? '' : scaleLimits.max;
        if (min !== '' && max !== '' && min > max) {
            throw new RRError('questionScaleMinGTMax');
        }
        return `${min}:${max}`;
    }
    return '';
};

const exportMetaQuestionProperties = function (meta, metaOptions, withChoice, fromQuestion) {
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
};

const importMetaQuestionProperties = function (record, metaOptions, fromType) {
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
};

module.exports = class QuestionDAO extends Translatable {
    constructor(db, dependencies) {
        super(db, 'QuestionText', 'questionId', ['text', 'instruction'], { instruction: true });
        Object.assign(this, dependencies);
        this.db = db;
    }

    createChoicesTx(questionId, choices, transaction) {
        const choicesWithParent = choices.map(ch => Object.assign({ questionId }, ch));
        return this.questionChoice.createQuestionChoicesTx(choicesWithParent, transaction)
            .then((ids) => {
                const idRecords = choices.reduce((r, choice, index) => {
                    const answerIdentifier = choice.answerIdentifier;
                    if (answerIdentifier) {
                        const { type, value: identifier } = answerIdentifier;
                        const questionChoiceId = ids[index];
                        const idRecord = { type, identifier, questionId, questionChoiceId };
                        r.push(idRecord);
                    }
                    return r;
                }, []);
                return this.db.AnswerIdentifier.bulkCreate(idRecords, { transaction })
                    .then(() => ids);
            })
            .then(ids => ids.map((id, index) => {
                const fields = _.pick(choices[index], ['text', 'code', 'meta']);
                return Object.assign({ id }, fields);
            }));
    }

    updateChoiceSetReference(choiceSetReference, transaction) {
        if (choiceSetReference) {
            return this.choiceSet.getChoiceSetIdByReference(choiceSetReference, transaction);
        }
        return SPromise.resolve(null);
    }

    createQuestionTx(question, transaction) {
        const Question = this.db.Question;
        return this.updateChoiceSetReference(question.choiceSetReference, transaction)
            .then((choiceSetId) => {
                const baseFields = _.omit(question, ['oneOfChoices', 'choices', 'text', 'instruction', 'scaleLimits']);
                if (choiceSetId) {
                    baseFields.choiceSetId = choiceSetId;
                }
                const parameter = parameterJsonToString(question);
                if (parameter) {
                    baseFields.parameter = parameter;
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
                                        choices = oneOfChoices.map(ch => ({ text: ch, type: 'bool' })); // eslint-disable-line max-len
                                    }
                                    return this.createChoicesTx(result.id, choices, transaction)
                                        .then((chs) => {
                                            result.choices = chs; // eslint-disable-line no-param-reassign, max-len
                                        });
                                }
                                return null;
                            })
                            .then(() => {
                                if (question.questionIdentifier) {
                                    const questionId = result.id;
                                    const { type, value: identifier } = question.questionIdentifier;
                                    return this.questionIdentifier.createQuestionIdentifier({ type, identifier, questionId }, transaction);  // eslint-disable-line max-len
                                }
                                return null;
                            })
                            .then(() => {
                                const questionId = result.id;
                                if (question.answerIdentifier) {
                                    const { type, value: identifier } = question.answerIdentifier;
                                    return this.answerIdentifier.createAnswerIdentifier({ type, identifier, questionId }, transaction); // eslint-disable-line max-len
                                } else if (question.answerIdentifiers) {
                                    const { type, values } = question.answerIdentifiers;
                                    const promises = values.map((identifier, multipleIndex) => this.answerIdentifier.createAnswerIdentifier({ type, identifier, questionId, multipleIndex }, transaction)); // eslint-disable-line max-len
                                    return SPromise.all(promises);
                                }
                                return null;
                            })
                            .then(() => result);
                    });
            });
    }

    createQuestion(question) {
        return this.transaction(transaction => this.createQuestionTx(question, transaction));
    }

    replaceQuestion(parentId, replacement) {
        const SurveyQuestion = this.db.SurveyQuestion;
        const Question = this.db.Question;
        return SurveyQuestion.count({ where: { questionId: parentId } })
            .then((count) => {
                if (count) {
                    return RRError.reject('qxReplaceWhenActiveSurveys');
                }
                return this.transaction((transaction) => {
                    const px = Question.findById(parentId, { transaction });
                    return px.then((question) => {
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
                                    const update = { version: 1, groupId: question.id };
                                    return question.update(update, { transaction })
                                        .then(() => id);
                                }
                                return id;
                            })
                            .then((id) => {
                                const where = { questionId: question.id };
                                return question.destroy({ transaction })
                                    .then(() => SurveyQuestion.destroy({ where }))
                                    .then(() => ({ id }));
                            });
                    });
                });
            });
    }

    getQuestion(qid, options = {}) {
        const Question = this.db.Question;
        const language = options.language;
        const attributes = ['id', 'type', 'meta', 'multiple', 'maxCount', 'choiceSetId', 'common', 'isIdentifying', 'parameter'];
        return Question.findById(qid, { raw: true, attributes })
            .then((question) => {
                if (!question) {
                    return RRError.reject('qxNotFound');
                }
                return cleanDBQuestion(question);
            })
            .then((question) => {
                if (question.choiceSetId) {
                    return this.questionChoice.listQuestionChoices(question.choiceSetId, language)
                        .then((choices) => {
                            question.choices = choices.map(({ id, text, code }) => ({ id, text, code })); // eslint-disable-line no-param-reassign, max-len
                            delete question.choiceSetId; // eslint-disable-line no-param-reassign, max-len
                            return question;
                        });
                }
                return question;
            })
            .then(question => this.updateText(question, language))
            .then((question) => {
                if (!isDirectChoiceType(question)) {
                    return question;
                }
                return this.questionChoice.findChoicesPerQuestion(question.id, options.language)
                    .then((choices) => {
                        if (question.type === 'choice') {
                            choices.forEach(r => delete r.type);
                        }
                        if (question.type === 'open-choice') {
                            choices.forEach((r) => {
                                if (r.type === 'bool') {
                                    delete r.type;
                                }
                            });
                        }
                        question.choices = choices;  // eslint-disable-line no-param-reassign, max-len
                        return question;
                    });
            })
            .then((question) => {
                if (options.federated) {
                    return this.updateFederatedIdentifier(question);
                }
                return question;
            });
    }

    updateFederatedIdentifier(question) {
        return this.db.AnswerIdentifier.findAll({
            raw: true,
            attributes: ['identifier', 'questionChoiceId'],
            where: { type: 'federated', questionId: question.id },
        })
            .then((result) => {
                if (result.length < 1) {
                    return question;
                }
                if (['choice', 'choices'].indexOf(question.type) < 0) {
                    question.answerIdentifier = result[0].identifier;  // eslint-disable-line no-param-reassign, max-len
                    return question;
                }
                const map = new Map(result.map(({ questionChoiceId, identifier }) => [questionChoiceId, identifier]));  // eslint-disable-line no-param-reassign, max-len
                question.choices.forEach((r) => {
                    const identifier = map.get(r.id);
                    if (identifier) {
                        r.identifier = identifier;
                    }
                });
                return question;
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
                    return this.questionChoice.createMultipleTextsTx(choices, language, tx);
                }
                return null;
            });
    }

    updateQuestionText(translation, language) {
        return this.transaction(tx => this.updateQuestionTextTx(translation, language, tx));
    }

    deleteQuestion(id) {
        const SurveyQuestion = this.db.SurveyQuestion;
        const Question = this.db.Question;
        return SurveyQuestion.count({ where: { questionId: id } })
            .then((count) => {
                if (count) {
                    return RRError.reject('qxReplaceWhenActiveSurveys');
                }
                return Question.destroy({ where: { id } })
                        .then(() => SurveyQuestion.destroy({ where: { questionId: id } }));
            });
    }

    findQuestions({ scope, ids, surveyId, surveyPublished, commonOnly, isIdentifying }) {
        const attributes = ['id', 'type', 'isIdentifying', 'parameter'];
        if (scope === 'complete' || scope === 'export') {
            attributes.push('meta', 'multiple', 'maxCount', 'choiceSetId');
        }
        if (scope === 'complete') {
            attributes.push('common');
        }
        const options = { attributes };
        if (ids || commonOnly) {
            const where = {};
            if (commonOnly) {
                where.common = true;
            }
            if (ids) {
                where.id = { [Op.in]: ids };
            }
            options.where = where;
        }
        if (surveyId || surveyPublished) {
            Object.assign(options, { model: this.db.Question, as: 'question' });
            const include = [options];
            if (surveyPublished) {
                include.push({
                    model: this.db.Survey,
                    as: 'survey',
                    attributes: [],
                    where: { status: 'published' },
                });
            }
            const sqOptions = { raw: true, include, attributes: [], order: ['question_id'] };
            if (surveyId) {
                sqOptions.where = { surveyId };
            }
            return this.db.SurveyQuestion.findAll(sqOptions)
                .then(questions => questions.map(question => Object.keys(question).reduce((r, key) => {  // eslint-disable-line no-param-reassign, max-len
                    const newKey = key.split('.')[1];
                    r[newKey] = question[key];
                    return r;
                }, {})));
        }
        if (!isIdentifying) {
            if (!options.where) { options.where = {}; }
            options.where.isIdentifying = false;
        }
        Object.assign(options, { raw: true, order: ['id'] });
        return this.db.Question.findAll(options);
    }

    findFederatedQuestions(options = {}) {
        return this.db.QuestionIdentifier.findAll({
            raw: true,
            attributes: ['questionId', 'identifier'],
            where: { type: 'federated' },
        })
            .then((records) => {
                const map = new Map(records.map(record => [record.questionId, record.identifier]));
                const ids = records.map(record => record.questionId);
                const optionsWithIds = Object.assign({ ids, options });
                return this.findQuestions(optionsWithIds)
                    .then((results) => {
                        results.forEach((result) => {
                            const identifier = map.get(result.id);
                            Object.assign(result, { identifier });
                        });
                        return results;
                    });
            });
    }

    findQuestionsForList(options) {
        if (options.federated) {
            return this.findFederatedQuestions(options);
        }
        return this.findQuestions(options);
    }

    listQuestions(options = {}) {
        const { ids, language } = options;
        const scope = options.scope || 'summary';
        return this.findQuestionsForList(options)
            .then(questions => questions.map(question => cleanDBQuestion(question)))
            .then((questions) => {
                if (!questions.length) {
                    return questions;
                }
                const map = new Map(questions.map(question => ([question.id, question])));
                if (ids) {
                    questions = ids.map(id => map.get(id));  // eslint-disable-line no-param-reassign, max-len
                    questions = questions.filter(question => !!question); // eslint-disable-line no-param-reassign, max-len
                } // Remove Undefined and NULL Questions ^^
                return this.updateAllTexts(questions, language)
                    .then(() => {
                        const promises = questions.reduce((r, question) => {
                            if (question.choiceSetId) {
                                const promise = this.questionChoice.listQuestionChoices(question.choiceSetId, language)  // eslint-disable-line max-len
                                    .then((choices) => {
                                        question.choices = choices.map(({ id, text, code }) => ({ id, text, code }));  // eslint-disable-line no-param-reassign, max-len
                                        delete question.choiceSetId;  // eslint-disable-line no-param-reassign, max-len
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
                                    choices.forEach((r) => {
                                        const q = map.get(r.questionId);
                                        if (q) {
                                            delete r.questionId;
                                            if (q.type === 'choice' || q.type === 'choice-ref') {
                                                delete r.type;
                                            }
                                            if (q.type === 'open-choice') {
                                                if (r.type === 'bool') {
                                                    delete r.type;
                                                }
                                            }
                                            if (q.choices) {
                                                q.choices.push(r);
                                            } else {
                                                q.choices = [r];
                                            }
                                        }
                                    });
                                });
                        }
                        return null;
                    })
                    .then(() => {
                        if (scope !== 'summary') {
                            questions.forEach((q) => {
                                if (isDirectChoiceType(q) && !q.choices) {
                                    q.choices = [];
                                }
                            });
                        }
                        return questions;
                    });
            });
    }

    addQuestionIdentifiersTx(questionId, identifiers, transaction) {
        const QuestionIdentifier = this.db.QuestionIdentifier;
        const { type, identifier, answerIdentifier, answerIdentifiers } = identifiers;
        return QuestionIdentifier.create({ type, identifier, questionId }, { transaction })
            .then(() => {
                if (answerIdentifier) {
                    const record = { type, identifier: answerIdentifier, questionId };
                    return this.db.AnswerIdentifier.create(record, { transaction });
                }
                const records = answerIdentifiers.map(r => ({
                    type,
                    identifier: r.identifier,
                    questionId,
                    questionChoiceId: r.questionChoiceId,
                }));
                return this.db.AnswerIdentifier.bulkCreate(records, { transaction });
            });
    }

    addQuestionIdentifiers(questionId, identifiers) {
        return this.transaction(transaction => this.addQuestionIdentifiersTx(questionId, identifiers, transaction)); // eslint-disable-line max-len
    }

    exportQuestions(options = {}) {
        return this.listQuestions({ scope: 'export' })
            .then(questions => questions.reduce((r, { id, type, text, scaleLimits, instruction, meta, choices }) => {  // eslint-disable-line no-param-reassign, max-len
                const questionLine = { id, type, text, instruction };
                const parameter = parameterJsonToString({ scaleLimits });
                Object.assign(questionLine, { parameter });
                if (meta && options.meta) {
                    Object.assign(questionLine, exportMetaQuestionProperties(meta, options.meta, choices, true)); // eslint-disable-line max-len
                }
                if (!choices) {
                    r.push(questionLine);
                    return r;
                }
                choices.forEach((choice, index) => {
                    const line = { choiceId: choice.id, choiceText: choice.text };
                    if (choice.type) {
                        line.choiceType = choice.type;
                    }
                    if (choice.code) {
                        line.choiceCode = choice.code;
                    }
                    if (choice.meta && options.meta) {
                        Object.assign(questionLine, exportMetaQuestionProperties(choice.meta, options.meta, true, false)); // eslint-disable-line max-len
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

    importQuestions(stream, options = {}) {
        const AnswerIdentifier = this.db.AnswerIdentifier;
        const converter = new ImportCSVConverter({ checkType: false });
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
                        if (record.parameter) {
                            question.parameter = record.parameter;
                        }
                        if (options.meta) {
                            const meta = importMetaQuestionProperties(record, options.meta, 'question'); // eslint-disable-line max-len
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
                            const meta = importMetaQuestionProperties(record, options.meta, 'choice'); // eslint-disable-line max-len
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
                return this.transaction((transaction) => {
                    const mapIds = {};
                    const pxs = records.map(({ id, question }) => {
                        const questionProper = _.omit(question, ['choices', 'key', 'answerKey', 'tag']); // eslint-disable-line max-len
                        return this.createQuestionTx(questionProper, transaction)
                            .then(({ id: questionId }) => {
                                const type = options.sourceType;
                                if (type && !question.choices) {
                                    const identifier = question.answerKey;
                                    const tag = parseInt(question.tag, 10);
                                    return AnswerIdentifier.create({ type, identifier, questionId, tag }, { transaction }) // eslint-disable-line max-len
                                        .then(() => questionId);
                                }
                                return questionId;
                            })
                            .then((questionId) => {
                                const choices = question.choices;
                                if (choices) {
                                    const inputChoices = choices.map(choice => _.omit(choice, ['id', 'answerKey', 'tag'])); // eslint-disable-line max-len
                                    return this.createChoicesTx(questionId, inputChoices, transaction)  // eslint-disable-line no-param-reassign, max-len
                                        .then(choicesIds => choicesIds.map(choicesId => choicesId.id))  // eslint-disable-line no-param-reassign, max-len
                                        .then((choicesIds) => {
                                            const type = options.sourceType;
                                            if (type) {
                                                const pxs2 = choicesIds.map((questionChoiceId, index) => {  // eslint-disable-line no-param-reassign, max-len
                                                    const identifier = choices[index].answerKey;
                                                    const tag = parseInt(choices[index].tag, 10);
                                                    return AnswerIdentifier.create({ type, identifier, questionId, questionChoiceId, tag }, { transaction }); // eslint-disable-line max-len
                                                });
                                                return SPromise.all(pxs2)
                                                    .then(() => choicesIds);
                                            }
                                            return choicesIds;
                                        })
                                        .then((choicesIds) => {
                                            mapIds[id] = {
                                                questionId,
                                                choicesIds: _.zipObject(choices.map(choice => choice.id), choicesIds), // eslint-disable-line max-len
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

    comparePatchQuestionTx(question, patch, language, tx) {
        const id = question.id;
        return SPromise.resolve()
            .then(() => {
                const { text: origText, instruction: orgInstruction } = question;
                const { text, instruction } = patch;
                if ((text !== origText) || (instruction !== orgInstruction)) {
                    return this.updateQuestionTextTx({ id, text, instruction }, language, tx);
                }
                return null;
            })
            .then(() => {
                const record = {};
                const { meta } = patch;
                if (!_.isEqual(question.meta, meta)) {
                    Object.assign(record, { meta: meta || null });
                }
                const common = patch.common || false;
                if (question.common !== common) {
                    Object.assign(record, { common });
                }
                const fields = ['type', 'multiple', 'maxCount', 'choiceSetId'];
                fields.forEach((field) => {
                    if (question[field] !== patch[field]) {
                        throw new RRError('qxPatchTypeFields', fields.join(', '));
                    }
                    return null;
                });
                const { scaleLimits } = patch;
                if (scaleLimits && question.scaleLimits && question.type === 'scale') {
                    if (!_.isEqual(question.scaleLimits, scaleLimits)) {
                        const parameter = parameterJsonToString({ scaleLimits });
                        Object.assign(record, { parameter });
                    }
                }
                if (!_.isEmpty(record)) {
                    return this.db.Question.update(record, { where: { id }, transaction: tx });
                }
                return null;
            })
            .then(() => {
                const chs = question.choices;
                const chsPatch = patch.choices;
                if (!isDirectChoiceType(question)) {
                    return {};
                }
                const opts = { force: patch.force, language };
                return this.questionChoice.patchChoicesForQuestion(id, chs, chsPatch, tx, opts);
            });
    }

    patchQuestionPairsTx(pairs, language, tx) {
        if (pairs && pairs.length) {
            const pxs = pairs.map((pair) => {
                const { object, patch } = pair;
                return this.comparePatchQuestionTx(object, patch, language, tx);
            });
            return SPromise.all(pxs)
                .then((result) => {
                    const flatResult = result.reduce((r, { newChoices }) => {
                        if (newChoices && newChoices.length) {
                            r.newChoices.push(...newChoices);
                        }
                        return r;
                    }, { newChoices: [] });
                    return flatResult;
                });
        }
        return SPromise.resolve();
    }

    patchQuestionTx(id, patch, tx) {
        const language = patch.language || 'en';
        return this.getQuestion(id, { language }) // TO DO: getQuestion with tx
            .then(question => this.comparePatchQuestionTx(question, patch, language, tx));
    }

    patchQuestion(id, patch) {
        return this.transaction(tx => this.patchQuestionTx(id, patch, tx));
    }
};
