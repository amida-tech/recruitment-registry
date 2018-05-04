'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const Base = require('./base');
const constNames = require('../const-names');

const Op = Sequelize.Op;

const comparators = {
    exists(answers) {
        return answers && answers.length;
    },
    'not-exists': function (answers) {
        return !(answers && answers.length);
    },
    equals(answers, ruleAnswers) {
        if (!(answers && answers.length)) {
            return false;
        }

        return _.isEqual(answers, ruleAnswers);
    },
    'not-equals': function (answers, ruleAnswers) {
        if (!(answers && answers.length)) {
            return false;
        }

        return !_.isEqual(answers, ruleAnswers);
    },
    'in-date-range': function (answers, ruleAnswers) {
        if (!(answers && answers.length)) {
            return false;
        }
        if (answers.length !== 1 || ruleAnswers.length !== 1) {
            return false; // not yet implemented
        }
        const ruleValue = _.get(ruleAnswers, '0.value');
        const value = _.get(answers, '0.value');
        if (value && ruleValue) {
            const [min, max] = ruleValue.split(':');
            if (min && max) {
                return value >= min && value <= max;
            }
            if (min) {
                return value >= min;
            }
            if (max) {
                return value <= max;
            }
        }
        return false;
    },
    'in-zip-range': function (answers, ruleAnswers) {
        const answersValues = answers.map(answer => answer.value);
        // Loop through the list of user's applicable anwsers
        return answersValues.some(answersValue =>
            // Loop through the list of ruleAnswers
             ruleAnswers.some((ruleAnswer) => {
                 let thing = false;
                // Loop through the list of inRangeValues
                 if (ruleAnswer.meta.inRangeValue) {
                     thing = ruleAnswer.meta.inRangeValue
                        .some(inRangeValue => answersValue === inRangeValue);
                 }
                 return thing;
             }));
    },
};

const compareAnswersToRuleAnswers = function (logic, answers, ruleAnswers) {
    const comparator = comparators[logic];
    if (comparator) {
        return comparator(answers, ruleAnswers);
    }
    return false;
};

module.exports = class UserSurveyDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    getUserSurveyStatus(userId, surveyId) {
        return this.db.UserSurvey.findOne({
            where: { userId, surveyId },
            raw: true,
            attributes: ['status'],
        })
            .then(userSurvey => (userSurvey ? userSurvey.status : 'new'));
    }

    createUserSurveyAnswers(userId, surveyId, input) {
        const { status, language, answers } = input;
        return this.answer.createAnswers({ userId, surveyId, answers, language, status });
    }

    getUserSurveyAnswers(userId, surveyId, options) {
        const result = {};
        const isIdentifying = options.isIdentifying;
        return this.getUserSurveyStatus(userId, surveyId)
            .then((status) => { result.status = status; })
            .then(() => this.answer.getAnswers({ userId, surveyId, isIdentifying }))
            .then((answers) => { result.answers = answers; })
            .then(() => {
                if (options.includeSurvey) {
                    return this.survey.getSurvey(surveyId, options)
                        .then((survey) => { result.survey = survey; });
                }
                return null;
            })
            .then(() => result);
    }

    getUserSurvey(userId, surveyId, options) {
        return this.getUserSurveyStatus(userId, surveyId)
            .then(status => this.survey.getAnsweredSurvey(userId, surveyId, options)
                .then(survey => ({ status, survey })));
    }

    disabledSurveysOnAnswers(surveyAnswerRules, userId) {
        const ruleSourceSet = new Set();
        const or = _.values(surveyAnswerRules).reduce((r, rules) => {
            rules.forEach((rule) => {
                const { answerSurveyId: surveyId, answerQuestionId: questionId } = rule;
                const key = `${surveyId}-${questionId}`;
                if (!ruleSourceSet.has(key)) {
                    ruleSourceSet.add(key);
                    r.push({ surveyId, questionId });
                }
            });
            return r;
        }, []);
        const where = { userId, [Op.or]: or };
        const attributes = ['surveyId', 'questionId', 'questionChoiceId', 'value'];
        return this.db.Answer.findAll({ where, attributes, raw: true })
            .then(records => records.reduce((r, record) => {
                const { surveyId, questionId, questionChoiceId, value } = record;
                const key = `${surveyId}-${questionId}`;
                const mapValue = { questionChoiceId, value };
                if (r[key]) {
                    r[key].push(mapValue);
                } else {
                    r[key] = [mapValue];
                }
                return r;
            }, {}))
            .then((answerMap) => {
                const surveyIds = Object.keys(surveyAnswerRules);
                return surveyIds.reduce((r, surveyId) => {
                    const rules = surveyAnswerRules[surveyId];
                    const enabled = rules.some((rule) => {
                        const { logic, answerQuestionId, answerSurveyId, values } = rule;
                        const key = `${answerSurveyId}-${answerQuestionId}`;
                        const answers = answerMap[key];
                        return compareAnswersToRuleAnswers(logic, answers, values);
                    });
                    if (!enabled) {
                        r.push(parseInt(surveyId, 10));
                    }
                    return r;
                }, []);
            });
    }

    disabledSurveysOnRules(statusMap, userId) {
        const where = {
            questionId: null,
            sectionId: null,
            answerSurveyId: { [Op.ne]: null },
        };
        const result = new Set();
        const attributes = ['id', 'logic', 'surveyId', 'answerQuestionId', 'answerSurveyId'];
        return this.db.AnswerRule.findAll({ raw: true, where, attributes, order: ['line'] })
            .then(answerRules => answerRules.filter(({ surveyId, answerSurveyId }) => {
                const status = statusMap.get(answerSurveyId);
                if (status !== 'completed') {
                    result.add(surveyId);
                    return false;
                }
                return true;
            }))
            .then((answerRules) => {
                if (!answerRules.length) {
                    return answerRules;
                }
                const ruleIds = answerRules.map(r => r.id);
                return this.db.AnswerRuleValue.findAll({
                    where: { ruleId: { [Op.in]: ruleIds } },
                    attributes: ['ruleId', 'questionChoiceId', 'value', 'meta'],
                    raw: true,
                })
                    .then((answerRuleValues) => {
                        const updatedAnswerRuleValues = answerRuleValues.map((answerRuleValue) => {
                            if (answerRuleValue.meta === null) {
                                return _.omit(answerRuleValue, 'meta');
                            }
                            return answerRuleValue;
                        });
                        if (updatedAnswerRuleValues.length) {
                            const groupedResult = _.groupBy(updatedAnswerRuleValues, 'ruleId');
                            answerRules.forEach((r) => {
                                const values = groupedResult[r.id];
                                if (values) {
                                    r.values = values.map(v => _.omit(v, 'ruleId'));
                                }
                            });
                        }
                        return answerRules;
                    });
            })
            .then((answerRules) => {
                if (answerRules.length) {
                    const surveyAnswerRules = _.groupBy(answerRules, 'surveyId');
                    return this.disabledSurveysOnAnswers(surveyAnswerRules, userId)
                        .then(additionalDisabled => new Set([...result, ...additionalDisabled]));
                }
                return result;
            });
    }

    listUserSurveys(userId, options) {
        const type = constNames.defaultSurveyType;
        const listSurveysOptions = Object.assign({ type }, options);
        return this.survey.listSurveys(listSurveysOptions)
            .then((surveys) => {
                if (surveys.length) {
                    const ids = surveys.map(survey => survey.id);
                    return this.db.UserSurvey.findAll({
                        where: { userId, surveyId: { [Op.in]: ids } },
                        raw: true,
                        attributes: ['surveyId', 'status'],
                    })
                        .then((userSurveys) => {
                            const mapInput = userSurveys.map(r => [r.surveyId, r.status]);
                            const statusMap = new Map(mapInput);
                            surveys.forEach((r) => {
                                r.status = statusMap.get(r.id) || 'new';
                            });
                            return { surveys, statusMap };
                        });
                }
                return { surveys };
            })
            .then(({ surveys, statusMap }) => {
                if (!statusMap) {
                    return surveys;
                }
                return this.disabledSurveysOnRules(statusMap, userId)
                    .then(disabledSurveys => surveys.filter(({ id }) => !disabledSurveys.has(id)));
            });
    }
};
