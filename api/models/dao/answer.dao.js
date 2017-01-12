'use strict';

const _ = require('lodash');

const db = require('../db');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');

const sequelize = db.sequelize;
const Answer = db.Answer;
const Question = db.Question;
const QuestionChoice = db.QuestionChoice;
const SurveyQuestion = db.SurveyQuestion;
const UserSurvey = db.UserSurvey;

const exportCSVConverter = require('../../export/csv-converter.js');
const importCSVConverter = require('../../import/csv-converter.js');

const answerValueToDBFormat = {
    boolValue(value) {
        value = value ? 'true' : 'false';
        return [{ value }];
    },
    dateValue(value) {
        return [{ value }];
    },
    yearValue(value) {
        return [{ value }];
    },
    monthValue(value) {
        return [{ value }];
    },
    dayValue(value) {
        return [{ value }];
    },
    textValue(value) {
        return [{ value }];
    },
    numberValue(value) {
        return [{ value }];
    },
    integerValue(value) {
        return [{ value }];
    },
    feetInchesValue(value) {
        const feet = value.feet || 0;
        const inches = value.inches || 0;
        return [{ value: `${feet}-${inches}` }];
    },
    bloodPressureValue(value) {
        const systolic = value.systolic || 0;
        const diastolic = value.diastolic || 0;
        return [{ value: `${systolic}-${diastolic}` }];
    }
};

const choiceValueToDBFormat = {
    choices(value) {
        return value.map(choice => {
            const questionChoiceId = choice.id;
            choice = _.omit(choice, 'id');
            const keys = Object.keys(choice);
            const numKeys = keys.length;
            if (numKeys > 1) {
                keys.sort();
                throw new RRError('answerMultipleTypeChoice', keys.join(', '));
            }
            if (numKeys === 0) {
                return { questionChoiceId, value: 'true' };
            }
            const key = keys[0];
            const fn = answerValueToDBFormat[key];
            if (!fn) {
                throw new RRError('answerAnswerNotUnderstood', key);
            }
            return Object.assign({ questionChoiceId }, fn(choice[key])[0]);
        });
    },
    choice(value) {
        return [{ questionChoiceId: value }];
    }
};

const prepareAnswerForDB = function prepareAnswerForDB(answer) {
    if (Array.isArray(answer)) {
        return answer.map(singleAnswer => {
            const multipleIndex = singleAnswer.multipleIndex;
            if (multipleIndex === undefined) {
                throw new RRError('answerNoMultiQuestionIndex');
            }
            const valuePiece = _.omit(singleAnswer, 'multipleIndex');
            const dbObject = prepareAnswerForDB(valuePiece)[0];
            dbObject.multipleIndex = multipleIndex;
            return dbObject;
        });
    }
    const keys = Object.keys(answer);
    const numKeys = keys.length;
    if (numKeys > 1) {
        keys.sort();
        throw new RRError('answerMultipleTypeAnswers', keys.join(', '));
    }
    const key = keys[0];
    let fn = choiceValueToDBFormat[key];
    if (!fn) {
        fn = answerValueToDBFormat[key];
    }
    if (!fn) {
        throw new RRError('answerAnswerNotUnderstood', key);
    }
    return fn(answer[key]);
};

const generateAnswerSingleFn = {
    text: value => ({ textValue: value }),
    zip: value => ({ textValue: value }),
    date: value => ({ dateValue: value }),
    year: value => ({ yearValue: value }),
    month: value => ({ monthValue: value }),
    day: value => ({ dayValue: value }),
    bool: value => ({ boolValue: value === 'true' }),
    'bool-sole': value => ({ boolValue: value === 'true' }),
    pounds: value => ({ numberValue: parseInt(value) }),
    integer: value => ({ integerValue: parseInt(value) }),
    enumeration: value => ({ integerValue: parseInt(value) }),
    'blood-pressure': value => {
        const pieces = value.split('-');
        return {
            bloodPressureValue: {
                systolic: parseInt(pieces[0]),
                diastolic: parseInt(pieces[1])
            }
        };
    },
    'feet-inches': value => {
        const pieces = value.split('-');
        return {
            feetInchesValue: {
                feet: parseInt(pieces[0]),
                inches: parseInt(pieces[1])
            }
        };
    }
};

const generateAnswerChoices = {
    choice: entries => ({ choice: entries[0].questionChoiceId }),
    choices: entries => {
        let choices = entries.map(r => {
            const answer = { id: r.questionChoiceId };
            const fn = generateAnswerSingleFn[r.choiceType || 'bool'];
            return Object.assign(answer, fn(r.value));
        });
        choices = _.sortBy(choices, 'id');
        return { choices };
    }
};

const generateAnswer = function (type, entries, multiple) {
    if (multiple) {
        const fn = generateAnswerSingleFn[type];
        const result = entries.map(entry => {
            const answer = { multipleIndex: entry.multipleIndex };
            if (type === 'choice') {
                Object.assign(answer, generateAnswerChoices.choice([entry]));
            } else {
                Object.assign(answer, fn(entry.value));
            }
            return answer;
        });
        return _.sortBy(result, 'multipleIndex');
    }
    const fnChoices = generateAnswerChoices[type];
    if (fnChoices) {
        return fnChoices(entries);
    }
    const fn = generateAnswerSingleFn[type];
    return fn(entries[0].value);
};

const fileAnswer = function ({ userId, surveyId, language, answers }, tx) {
    answers = answers.reduce((r, q) => {
        const questionId = q.questionId;
        const values = prepareAnswerForDB(q.answer || q.answers).map(value => ({
            userId,
            surveyId,
            language,
            questionId,
            questionChoiceId: value.questionChoiceId || null,
            multipleIndex: (value.multipleIndex || value.multipleIndex === 0) ? value.multipleIndex : null,
            value: value.hasOwnProperty('value') ? value.value : null
        }));
        values.forEach(value => r.push(value));
        return r;
    }, []);
    // TODO: Switch to bulkCreate when Sequelize 4 arrives
    return SPromise.all(answers.map(answer => {
        return Answer.create(answer, { transaction: tx });
    }));
};

const updateStatus = function (userId, surveyId, status, transaction) {
    return UserSurvey.findOne({
            where: { userId, surveyId },
            raw: true,
            attributes: ['status'],
            transaction
        })
        .then(userSurvey => {
            if (!userSurvey) {
                return UserSurvey.create({ userId, surveyId, status }, { transaction });
            } else if (userSurvey.status !== status) {
                return UserSurvey.destroy({ where: { userId, surveyId }, transaction })
                    .then(() => UserSurvey.create({ userId, surveyId, status }, { transaction }));
            }
        });
};

module.exports = class AnswerDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    toDbAnswer(answer) {
        return prepareAnswerForDB(answer);
    }

    toInterfaceAnswer(type, entries, multiple) {
        return generateAnswer(type, entries, multiple);
    }

    validateConsent(userId, surveyId, action, transaction) {
        return this.surveyConsentDocument.listSurveyConsentDocuments({
                userId,
                surveyId,
                action
            }, transaction)
            .then(consentDocuments => {
                if (consentDocuments && consentDocuments.length > 0) {
                    const err = new RRError('profileSignaturesMissing');
                    err.consentDocuments = consentDocuments;
                    return SPromise.reject(err);
                }
            });
    }

    validateAnswers(userId, surveyId, answers, status) {
        return SurveyQuestion.findAll({
                where: { surveyId },
                raw: true,
                attributes: ['questionId', 'required']
            })
            .then(surveyQuestions => _.keyBy(surveyQuestions, 'questionId'))
            .then(qxMap => {
                answers.forEach(answer => {
                    const qx = qxMap[answer.questionId];
                    if (!qx) {
                        throw new RRError('answerQxNotInSurvey');
                    }
                    if (answer.answer || answer.answers) {
                        qx.required = false;
                    }
                });
                return qxMap;
            })
            .then(qxMap => {
                if (status === 'completed') {
                    const remainingRequired = new Set();
                    _.values(qxMap).forEach(qx => {
                        if (qx.required) {
                            remainingRequired.add(qx.questionId);
                        }
                    });
                    if (remainingRequired.size) {
                        const ids = [...remainingRequired];
                        return Answer.findAll({
                                raw: true,
                                where: { userId, surveyId, questionId: { $in: ids } },
                                attributes: ['questionId']
                            })
                            .then(records => {
                                const questionIds = records.map(record => record.questionId);
                                const existingRequired = new Set(questionIds);
                                if (existingRequired.size !== remainingRequired.size) {
                                    throw new RRError('answerRequiredMissing');
                                }
                            });
                    }
                }
            });
    }

    validateCreate(userId, surveyId, answers, status, transaction) {
        return this.validateAnswers(userId, surveyId, answers, status)
            .then(() => this.validateConsent(userId, surveyId, 'create', transaction));
    }

    createAnswersTx({ userId, surveyId, answers, language = 'en', status = 'completed' }, transaction) {
        return this.validateCreate(userId, surveyId, answers, status, transaction)
            .then(() => updateStatus(userId, surveyId, status, transaction))
            .then(() => {
                const ids = _.map(answers, 'questionId');
                const where = { questionId: { $in: ids }, surveyId, userId };
                return Answer.destroy({ where, transaction });
            })
            .then(() => {
                answers = _.filter(answers, answer => answer.answer || answer.answers);
                if (answers.length) {
                    return fileAnswer({ userId, surveyId, language, answers }, transaction);
                }
            });
    }

    createAnswers(input) {
        return sequelize.transaction(tx => {
            return this.createAnswersTx(input, tx);
        });
    }

    listAnswers({ userId, scope, surveyId, history, ids }) {
        scope = scope || 'survey';
        const where = ids ? { id: { $in: ids } } : { userId };
        if (surveyId) {
            where.surveyId = surveyId;
        }
        if (scope === 'history-only') {
            where.deletedAt = { $ne: null };
        }
        const attributes = ['questionChoiceId', 'language', 'multipleIndex', 'value'];
        if (scope === 'export' || !surveyId) {
            attributes.push('surveyId');
        }
        if (scope === 'history-only') {
            attributes.push([sequelize.fn('to_char', sequelize.col('answer.deleted_at'), 'SSSS.MS'), 'deletedAt']);
        }
        const include = [
            { model: Question, as: 'question', attributes: ['id', 'type', 'multiple'] },
            { model: QuestionChoice, as: 'questionChoice', attributes: ['type'] }
        ];
        return Answer.findAll({ raw: true, where, attributes, include, paranoid: !history })
            .then(result => {
                result.forEach(answer => {
                    if (answer['question.type'] === 'choices') {
                        answer.choiceType = answer['questionChoice.type'];
                    }
                    delete answer['questionChoice.type'];
                });
                return result;
            })
            .then(result => {
                if (scope === 'export') {
                    return result.map(answer => {
                        const r = { surveyId: answer.surveyId };
                        r.questionId = answer['question.id'];
                        r.questionType = answer['question.type'];
                        if (answer.questionChoiceId) {
                            r.questionChoiceId = answer.questionChoiceId;
                        }
                        if (answer.value) {
                            r.value = answer.value;
                        }
                        if (answer.choiceType) {
                            r.choiceType = answer.choiceType;
                        }
                        return r;
                    });
                }
                const groupedResult = _.groupBy(result, function (r) {
                    let surveyId = r.surveyId;
                    let deletedAt = r.deletedAt;
                    let key = r['question.id'];
                    if (deletedAt) {
                        key = deletedAt + ';' + key;
                    }
                    if (surveyId) {
                        key = surveyId + ';' + key;
                    }
                    return key;
                });
                return Object.keys(groupedResult).map(key => {
                    const v = groupedResult[key];
                    const r = {
                        questionId: v[0]['question.id'],
                        language: v[0].language
                    };
                    if (v[0]['question.multiple']) {
                        r.answers = generateAnswer(v[0]['question.type'], v, true);
                    } else {
                        r.answer = generateAnswer(v[0]['question.type'], v, false);
                    }
                    if (scope === 'history-only') {
                        r.deletedAt = v[0].deletedAt;
                    }
                    if (v[0].surveyId) {
                        r.surveyId = v[0].surveyId;
                    }
                    return r;
                });
            });
    }

    getAnswers({ userId, surveyId }) {
        return this.validateConsent(userId, surveyId, 'read')
            .then(() => this.listAnswers({ userId, surveyId }));
    }

    exportForUser(userId) {
        return this.listAnswers({ userId, scope: 'export' })
            .then(answers => {
                const converter = new exportCSVConverter({ fields: ['surveyId', 'questionId', 'questionChoiceId', 'questionType', 'choiceType', 'value'] });
                return converter.dataToCSV(answers);
            });
    }

    importForUser(userId, stream, surveyIdMap, questionIdMap) {
        const converter = new importCSVConverter();
        return converter.streamToRecords(stream)
            .then(records => {
                return records.map(record => {
                    record.surveyId = surveyIdMap[record.surveyId];
                    const questionIdInfo = questionIdMap[record.questionId];
                    record.questionId = questionIdInfo.questionId;
                    if (record.questionChoiceId) {
                        const choicesIds = questionIdInfo.choicesIds;
                        record.questionChoiceId = choicesIds[record.questionChoiceId];
                    } else {
                        record.questionChoiceId = null;
                    }
                    if (record.value === '') {
                        delete record.value;
                    } else {
                        record.value = record.value.toString();
                    }
                    if (record.choiceType === 'month' || record.questionType === 'month') {
                        if (record.value.length === 1) {
                            record.value = '0' + record.value;
                        }
                    }
                    delete record.questionType;
                    delete record.choiceType;
                    record.userId = userId;
                    record.language = 'en';
                    return record;
                });
            })
            .then(records => {
                return sequelize.transaction(transaction => {
                    // TODO: Switch to bulkCreate when Sequelize 4 arrives
                    return SPromise.all(records.map(record => {
                        return Answer.create(record, { transaction });
                    }));
                });
            });
    }

    importRecords(records) {
        return sequelize.transaction(transaction => {
            // TODO: Switch to bulkCreate when Sequelize 4 arrives
            return SPromise.all(records.map(record => {
                return Answer.create(record, { transaction })
                    .then(({ id }) => id);
            }));
        });
    }

    exportBulk(ids) {
        const createdAtColumn = [sequelize.fn('to_char', sequelize.col('answer.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'createdAt'];
        return Answer.findAll({
            where: { id: { $in: ids } },
            attributes: ['id', 'userId', 'surveyId', 'questionId', 'questionChoiceId', 'value', createdAtColumn],
            include: [
                { model: Question, as: 'question', attributes: ['id', 'type'] },
                { model: QuestionChoice, as: 'questionChoice', attributes: ['type'] }
            ],
            raw: true,
            paranoid: false
        });
    }
};
