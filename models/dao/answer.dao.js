'use strict';

const _ = require('lodash');
const request = require('request');

const Base = require('./base');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');

const answerCommon = require('./answer-common');

const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

const evaluateAnswerRule = function ({ logic, answer }, questionAnswer) {
    if (logic === 'exists') {
        if (questionAnswer && (questionAnswer.answer || questionAnswer.answers)) {
            return true;
        }
    }
    if (logic === 'not-exists') {
        if (!(questionAnswer && (questionAnswer.answer || questionAnswer.answers))) {
            return true;
        }
    }
    if (logic === 'equals') {
        if (!questionAnswer) {
            return false;
        }

        if (_.isEqual(answer, questionAnswer.answer)) {
            return true;
        }
    }
    if (logic === 'not-equals') {
        if (!questionAnswer) {
            return false;
        }
        if (!_.isEqual(answer, questionAnswer.answer)) {
            return true;
        }
    }
    return false;
};

const evaluateEnableWhen = function (rules, answersByQuestionId) {
    return rules.some((rule) => {
        const sourceQuestionId = rule.questionId;
        const sourceAnswer = answersByQuestionId[sourceQuestionId];
        return evaluateAnswerRule(rule, sourceAnswer);
    });
};

const basicExportFields = [
    'surveyId', 'questionId', 'questionChoiceId', 'questionType', 'choiceType', 'value',
];

const requestPost = function (registryName, questions, url) {
    const opts = {
        json: true,
        body: questions,
        url: `${url}/answers/queries`,
    };
    const key = `RECREG_JWT_${registryName}`;
    const jwt = process.env[key];
    if (key) {
        opts.headers = {
            authorization: `Bearer ${jwt}`,
        };
    }

    return new Promise((resolve, reject) => (
        request.post(opts, (err, res) => {
            if (err) {
                const rrerror = new RRError('answerRemoteRegistryError', registryName, err.message);
                return reject(rrerror);
            }
            if (res.statusCode !== 200) {
                const rrerror = new RRError('answerRemoteRegistryError', registryName, res.body.message);
                return reject(rrerror);
            }
            return resolve(res.body);
        })
    ));
};

const isEnabled = function ({ questionId, parents }, questionAnswerRulesMap, sectionAnswerRulesMap, answersByQuestionId) {
    const rules = questionAnswerRulesMap.get(questionId);
    if (rules && rules.length) {
        const enabled = evaluateEnableWhen(rules, answersByQuestionId);
        return enabled;
    }
    if (parents && parents.length) {
        const enabled = parents.every(({ sectionId, questionId }) => {
            if (sectionId) {
                const rules = sectionAnswerRulesMap.get(sectionId);
                if (rules && rules.length) {
                    return evaluateEnableWhen(rules, answersByQuestionId);
                }
                return true;
            }
            if (questionId) {
                const rules = questionAnswerRulesMap.get(questionId);
                if (rules && rules.length) {
                    return evaluateEnableWhen(rules, answersByQuestionId);
                }
                return true;
            }
            return true;
        });
        if (!enabled) {
            return false;
        }
    }
    return true;
};

module.exports = class AnswerDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    fileAnswer({ userId, surveyId, language, answers }, transaction) {
        const Answer = this.db.Answer;
        answers = answers.reduce((r, q) => {
            const questionId = q.questionId;
            const values = answerCommon.prepareAnswerForDB(q.answer || q.answers).map(value => ({
                userId,
                surveyId,
                language,
                questionId,
                questionChoiceId: value.questionChoiceId || null,
                multipleIndex: (value.multipleIndex || value.multipleIndex === 0) ? value.multipleIndex : null,
                value: Object.prototype.hasOwnProperty.call(value, 'value') ? value.value : null,
            }));
            values.forEach(value => r.push(value));
            return r;
        }, []);
        return Answer.bulkCreate(answers, { transaction });
    }

    updateStatus(userId, surveyId, status, transaction) {
        const UserSurvey = this.db.UserSurvey;
        return UserSurvey.findOne({
            where: { userId, surveyId },
            raw: true,
            attributes: ['status'],
            transaction,
        })
            .then((userSurvey) => {
                if (!userSurvey) {
                    return UserSurvey.create({ userId, surveyId, status }, { transaction });
                } else if (userSurvey.status !== status) {
                    return UserSurvey.destroy({ where: { userId, surveyId }, transaction })
                        .then(() => UserSurvey.create({ userId, surveyId, status }, { transaction }));
                }
                return null;
            });
    }

    validateConsent(userId, surveyId, action, transaction) {
        return this.surveyConsentDocument.listSurveyConsentDocuments({
            userId,
            surveyId,
            action,
        }, {}, transaction)
            .then((consentDocuments) => {
                if (consentDocuments && consentDocuments.length > 0) {
                    const err = new RRError('profileSignaturesMissing');
                    err.consentDocuments = consentDocuments;
                    return SPromise.reject(err);
                }
                return null;
            });
    }

    validateAnswers(userId, surveyId, answers, status) {
        const Answer = this.db.Answer;
        return this.surveyQuestion.listSurveyQuestions(surveyId, true)
            .then((surveyQuestions) => {
                const answersByQuestionId = _.keyBy(answers, 'questionId');
                return this.answerRule.getQuestionExpandedSurveyAnswerRules(surveyId)
                    .then(({ sectionAnswerRulesMap, questionAnswerRulesMap }) => {
                        surveyQuestions.forEach((surveyQuestion) => {
                            const questionId = surveyQuestion.questionId;
                            const answer = answersByQuestionId[questionId];
                            if (sectionAnswerRulesMap || questionAnswerRulesMap) {
                                const enabled = isEnabled(surveyQuestion, questionAnswerRulesMap, sectionAnswerRulesMap, answersByQuestionId);
                                if (!enabled) {
                                    surveyQuestion.ignore = true;
                                }
                            }
                            if (surveyQuestion.ignore) {
                                if (answer) {
                                    throw new RRError('answerToBeSkippedAnswered');
                                }
                                surveyQuestion.required = false;
                                answers.push({ questionId });
                                return;
                            }
                            if (answer && (answer.answer || answer.answers)) {
                                surveyQuestion.required = false;
                            }
                        });
                        return surveyQuestions;
                    });
            })
            .then(surveyQuestions => _.keyBy(surveyQuestions, 'questionId'))
            .then((qxMap) => {
                answers.forEach((answer) => {
                    const qx = qxMap[answer.questionId];
                    if (!qx) {
                        throw new RRError('answerQxNotInSurvey');
                    }
                });
                return qxMap;
            })
            .then((qxMap) => {
                if (status === 'completed') {
                    const remainingRequired = new Set();
                    _.values(qxMap).forEach((qx) => {
                        if (qx.required) {
                            remainingRequired.add(qx.questionId);
                        }
                    });
                    if (remainingRequired.size) {
                        const ids = [...remainingRequired];
                        return Answer.findAll({
                            raw: true,
                            where: { userId, surveyId, questionId: { $in: ids } },
                            attributes: ['questionId'],
                        })
                            .then((records) => {
                                const questionIds = records.map(record => record.questionId);
                                const existingRequired = new Set(questionIds);
                                if (existingRequired.size !== remainingRequired.size) {
                                    throw new RRError('answerRequiredMissing');
                                }
                            });
                    }
                }
                return null;
            });
    }

    validateCreate(userId, surveyId, answers, status, transaction) {
        return this.validateAnswers(userId, surveyId, answers, status)
            .then(() => this.validateConsent(userId, surveyId, 'create', transaction));
    }

    createAnswersTx({ userId, surveyId, answers, language = 'en', status = 'completed' }, transaction) {
        const Answer = this.db.Answer;
        answers = _.cloneDeep(answers);
        return this.validateCreate(userId, surveyId, answers, status, transaction)
            .then(() => this.updateStatus(userId, surveyId, status, transaction))
            .then(() => {
                const ids = _.map(answers, 'questionId');
                const where = { questionId: { $in: ids }, surveyId, userId };
                return Answer.destroy({ where, transaction });
            })
            .then(() => {
                answers = _.filter(answers, answer => answer.answer || answer.answers);
                if (answers.length) {
                    return this.fileAnswer({ userId, surveyId, language, answers }, transaction);
                }
                return null;
            });
    }

    createAnswers(input) {
        return this.transaction(tx => this.createAnswersTx(input, tx));
    }

    listAnswers({ userId, scope, surveyId, history, ids, userIds }) {
        const Answer = this.db.Answer;
        const Question = this.db.Question;
        const QuestionChoice = this.db.QuestionChoice;
        scope = scope || 'survey';
        const where = {};
        if (ids) {
            where.id = { $in: ids };
        }
        if (userId) {
            where.userId = userId;
        }
        if (userIds) {
            where.userId = { $in: userIds };
        }
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
            attributes.push(this.timestampColumn('answer', 'deleted', 'SSSS.MS'));
        }
        if (userIds) {
            attributes.push('userId');
        }
        const include = [
            { model: Question, as: 'question', attributes: ['id', 'type', 'multiple'] },
            { model: QuestionChoice, as: 'questionChoice', attributes: ['type'] },
        ];
        return Answer.findAll({ raw: true, where, attributes, include, paranoid: !history })
            .then((result) => {
                result.forEach((answer) => {
                    if (answer['question.type'] === 'choices') {
                        answer.choiceType = answer['questionChoice.type'];
                    }
                    delete answer['questionChoice.type'];
                });
                return result;
            })
            .then((result) => {
                if (scope === 'export') {
                    return result.map((answer) => {
                        const r = { surveyId: answer.surveyId };
                        if (userIds) {
                            r.userId = answer.userId;
                        }
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
                const groupedResult = _.groupBy(result, (r) => {
                    const surveyId = r.surveyId;
                    const deletedAt = r.deletedAt;
                    let key = r['question.id'];
                    if (deletedAt) {
                        key = `${deletedAt};${key}`;
                    }
                    if (surveyId) {
                        key = `${surveyId};${key}`;
                    }
                    return key;
                });
                return Object.keys(groupedResult).map((key) => {
                    const v = groupedResult[key];
                    const r = {
                        questionId: v[0]['question.id'],
                        language: v[0].language,
                    };
                    if (v[0]['question.multiple']) {
                        r.answers = answerCommon.generateAnswer(v[0]['question.type'], v, true);
                    } else {
                        r.answer = answerCommon.generateAnswer(v[0]['question.type'], v, false);
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
            .then((answers) => {
                const converter = new ExportCSVConverter({ fields: basicExportFields });
                return converter.dataToCSV(answers);
            });
    }

    exportForUsers(userIds) {
        const fields = ['userId', ...basicExportFields];
        return this.listAnswers({ userIds, scope: 'export' })
            .then((answers) => {
                const converter = new ExportCSVConverter({ fields });
                return converter.dataToCSV(answers);
            });
    }

    importAnswers(stream, maps) {
        const { userId, surveyIdMap, questionIdMap, userIdMap } = maps;
        const converter = new ImportCSVConverter({ checkType: false });
        return converter.streamToRecords(stream)
            .then(records => records.map((record) => {
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
                        record.value = `0${record.value}`;
                    }
                }
                delete record.questionType;
                delete record.choiceType;
                record.userId = userId || userIdMap[record.userId];
                record.language = 'en';
                return record;
            }))
            .then(records => this.db.Answer.bulkCreate(records));
    }

    importRecords(records) {
        const fn = r => r.map(({ id }) => id);
        return this.db.Answer.bulkCreate(records, { returning: true }).then(fn);
    }

    exportBulk(ids) {
        const Answer = this.db.Answer;
        const Question = this.db.Question;
        const QuestionChoice = this.db.QuestionChoice;
        const createdAtColumn = this.timestampColumn('answer', 'created');
        return Answer.findAll({
            where: { id: { $in: ids } },
            attributes: ['id', 'userId', 'surveyId', 'questionId', 'questionChoiceId', 'value', createdAtColumn],
            include: [
                { model: Question, as: 'question', attributes: ['id', 'type'] },
                { model: QuestionChoice, as: 'questionChoice', attributes: ['type'] },
            ],
            raw: true,
            paranoid: false,
        });
    }

    /**
     * Search users by their survey answers. Returns a count of users only.
     * @param {object} query questionId:value mapping to search users by
     * @returns {integer}
     */
    searchUsers(criteria) {
        if (!_.get(criteria, 'questions.length')) {
            const attributes = ['id'];
            return this.db.User.findAll({ raw: true, where: { role: 'participant' }, attributes })
                .then(ids => ids.map(({ id }) => ({ userId: id })));
        }

        const questionIds = criteria.questions.map(question => question.id);
        if (questionIds.length !== new Set(questionIds).size) { return RRError.reject('searchQuestionRepeat'); }

        // find answers that match one of the search criteria
        const where = { $or: [] };
        criteria.questions.forEach((question) => {
            answerCommon.prepareFilterAnswersForDB(question.answers).forEach((answer) => {
                where.$or.push({
                    question_id: question.id,
                    value: ('value' in answer) ? answer.value.toString() : null,
                    question_choice_id: ('questionChoiceId' in answer) ? answer.questionChoiceId : null,
                });
            });
        });

        // find users with a matching answer for each question (i.e., users who match all criteria)
        const include = [{ model: this.db.User, as: 'user', attributes: [] }];
        const having = this.where(this.literal('COUNT(DISTINCT(question_id))'), criteria.questions.length);
        const group = ['user_id'];

        // count resulting users
        const attributes = ['userId'];
        return this.db.Answer.findAll({ raw: true, where, attributes, include, having, group });
    }

    /**
     * Search users by their survey answers. Returns a count of users only.
     * @param {object} query questionId:value mapping to search users by
     * @returns {integer}
     */
    searchCountUsers(criteria) {
        // if criteria is empty, return count of all users
        if (!_.get(criteria, 'questions.length')) {
            return this.db.User.count({ where: { role: 'participant' } })
                .then(count => ({ count }));
        }

        return this.searchUsers(criteria)
            .then(results => ({ count: results.length }));
    }

    federalSearchCountUsers(federalModels, federalCriteria) {
        const federals = federalCriteria.federal || [];
        const attributes = ['id', 'name', 'url', 'schema'];
        return this.db.Registry.findAll({ raw: true, attributes })
            .then((registries) => {
                if (!registries.length) {
                    return RRError.reject('registryNoneFound');
                }
                const registryMap = new Map(registries.map(registry => [registry.id, registry]));
                federals.forEach(({ registryId }) => {
                    if (!registryMap.has(registryId)) {
                        throw new RRError('registryIdNotFound', registryId);
                    }
                });
                return registries;
            })
            .then((registries) => {
                const criteriaMapInput = federals.map(({ registryId, criteria }) => [registryId, criteria]);
                const criteriaMap = new Map(criteriaMapInput);
                const promises = registries.map(({ id, name, schema, url }) => {
                    const criteria = criteriaMap.get(id);
                    if (schema) {
                        const models = federalModels[schema];
                        return models.answer.searchCountUsers(criteria);
                    }
                    return requestPost(name, criteria, url);
                });
                return SPromise.all(promises);
            })
            .then(federal => this.searchCountUsers(federalCriteria.local.criteria)
                    .then((local) => {
                        const result = { local, federal };
                        const totalCount = federal.reduce((r, { count }) => r + count, local.count);
                        result.total = { count: totalCount };
                        return result;
                    }));
    }
};
