'use strict';

const _ = require('lodash');

const db = require('../db');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');

const sequelize = db.sequelize;
const Answer = db.Answer;
const Question = db.Question;
const SurveyQuestion = db.SurveyQuestion;

const missingConsentDocumentHandler = function () {
    return function (consentDocuments) {
        if (consentDocuments && consentDocuments.length > 0) {
            const err = new RRError('profileSignaturesMissing');
            err.consentDocument = consentDocuments;
            return SPromise.reject(err);
        }
    };
};

const uiToDbAnswer = function (answer) {
    let result = [];
    if (answer.hasOwnProperty('choices')) {
        answer.choices.forEach(choice => {
            const dbAnswer = {
                questionChoiceId: choice.id
            };
            if (choice.hasOwnProperty('textValue')) {
                dbAnswer.value = choice.textValue;
                dbAnswer.type = 'text';
            } else if (choice.hasOwnProperty('boolValue')) {
                dbAnswer.value = choice.boolValue.toString();
                dbAnswer.type = 'bool';
            } else {
                dbAnswer.value = 'true';
                dbAnswer.type = 'bool';
            }
            result.push(dbAnswer);
        });
    }
    if (answer.hasOwnProperty('choice')) {
        result.push({
            questionChoiceId: answer.choice,
            type: 'choice'
        });
    }
    if (answer.hasOwnProperty('boolValue')) {
        result.push({
            value: answer.boolValue ? 'true' : 'false',
            type: 'bool'
        });
    }
    if (answer.hasOwnProperty('textValue')) {
        result.push({
            value: answer.textValue,
            type: 'text'
        });
    }
    return result;
};

const generateAnswer = {
    text: entries => ({ textValue: entries[0].value }),
    bool: entries => ({ boolValue: entries[0].value === 'true' }),
    choice: entries => ({ choice: entries[0].questionChoiceId }),
    choices: entries => {
        let choices = entries.map(r => {
            const answer = { id: r.questionChoiceId };
            if (r.type === 'text') {
                answer.textValue = r.value;
                return answer;
            }
            answer.boolValue = (r.value === 'true'); // type bool
            return answer;
        });
        choices = _.sortBy(choices, 'id');
        return { choices };
    }
};

module.exports = class {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    auxCreateAnswersTx({ userId, surveyId, language, answers }, tx) {
        // TO DO: Put an assertion here to check the answers match with question type
        answers = answers.reduce((r, q) => {
            const questionId = q.questionId;
            const values = uiToDbAnswer(q.answer).map(value => ({
                userId,
                surveyId,
                language,
                questionId,
                questionChoiceId: value.questionChoiceId || null,
                value: value.hasOwnProperty('value') ? value.value : null,
                type: value.type
            }));
            values.forEach(value => r.push(value));
            return r;
        }, []);
        // TODO: Switch to bulkCreate when Sequelize 4 arrives
        return SPromise.all(answers.map(answer => {
            return Answer.create(answer, { transaction: tx });
        }));
    }

    createAnswersTx({ userId, surveyId, language = 'en', answers }, tx) {
        const ids = _.map(answers, 'questionId');
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
                    if (answer.answer) {
                        qx.required = false;
                    }
                });
                _.values(qxMap).forEach(qx => {
                    if (qx.required) {
                        throw new RRError('answerRequiredMissing');
                    }
                });
            })
            .then(() => Answer.destroy({
                where: {
                    questionId: { $in: ids },
                    surveyId,
                    userId
                },
                transaction: tx
            }))
            .then(() => this.surveyConsentType.listSurveyConsentTypes({
                userId,
                surveyId,
                action: 'create'
            }, tx))
            .then(missingConsentDocumentHandler())
            .then(() => {
                answers = _.filter(answers, answer => answer.answer);
                if (answers.length) {
                    return this.auxCreateAnswersTx({ userId, surveyId, language, answers }, tx);
                }
            });
    }

    createAnswers(input) {
        return sequelize.transaction(tx => {
            return this.createAnswersTx(input, tx);
        });
    }

    getAnswers({ userId, surveyId }) {
        return this.surveyConsentType.listSurveyConsentTypes({
                userId,
                surveyId,
                action: 'read'
            })
            .then(missingConsentDocumentHandler())
            .then(() => {
                return Answer.findAll({
                        raw: true,
                        where: { userId, surveyId },
                        attributes: ['questionChoiceId', 'language', 'value', 'type'],
                        include: [{
                            model: Question,
                            as: 'question',
                            attributes: ['id', 'type']
                        }]
                    })
                    .then(result => {
                        const groupedResult = _.groupBy(result, 'question.id');
                        return Object.keys(groupedResult).map(key => {
                            const v = groupedResult[key];
                            const r = {
                                questionId: v[0]['question.id'],
                                language: v[0].language,
                                answer: generateAnswer[v[0]['question.type']](v)
                            };
                            return r;
                        });
                    });
            });
    }

    getOldAnswers({ userId, surveyId }) {
        return Answer.findAll({
                paranoid: false,
                where: { userId, surveyId, deletedAt: { $ne: null } },
                raw: true,
                order: 'deleted_at',
                attributes: [
                    'language',
                    'questionChoiceId',
                    'value',
                    'type',
                    'questionId', [sequelize.fn('to_char', sequelize.col('deleted_at'), 'SSSS.MS'), 'deletedAt']
                ]
            })
            .then(rawAnswers => {
                const qidGrouped = _.groupBy(rawAnswers, 'questionId');
                const qids = Object.keys(qidGrouped);
                return Question.findAll({
                        where: { id: { $in: qids } },
                        raw: true,
                        attributes: ['id', 'type']
                    })
                    .then(rawQuestions => _.keyBy(rawQuestions, 'id'))
                    .then(qxMap => {
                        const rmGrouped = _.groupBy(rawAnswers, 'deletedAt');
                        return Object.keys(rmGrouped).reduce((r, date) => {
                            const rmGroup = rmGrouped[date];
                            const qxGrouped = _.groupBy(rmGroup, 'questionId');
                            const newValue = Object.keys(qxGrouped).map(qid => {
                                const qxGroup = qxGrouped[qid];
                                return {
                                    questionId: parseInt(qid),
                                    language: qxGroup[0].language,
                                    answer: generateAnswer[qxMap[qid].type](qxGroup)
                                };
                            });
                            r[date] = _.sortBy(newValue, 'questionId');
                            return r;
                        }, {});
                    });
            });
    }
};
