'use strict';

const _ = require('lodash');
const db = require('../db');
const answerCommon = require('./answer-common');

const AnswerRule = db.AnswerRule;
const AnswerRuleValue = db.AnswerRuleValue;
const Question = db.Question;
const QuestionChoice = db.QuestionChoice;

module.exports = class AnswerRuleDAO {
    constructor() {}

    evaluateAnswerRule({ count, rule: { logic, answer, selectionIds } }, questionAnswer) {
        if (logic === 'exists') {
            if (questionAnswer && (questionAnswer.answer || questionAnswer.answers)) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
        }
        if (logic === 'not-exists') {
            if (!(questionAnswer && (questionAnswer.answer || questionAnswer.answers))) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
        }
        if (logic === 'equals') {
            if (!questionAnswer) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }

            if (_.isEqual(answer, questionAnswer.answer)) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
        }
        if (logic === 'not-equals') {
            if (!questionAnswer) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
            if (!_.isEqual(answer, questionAnswer.answer)) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
        }
        if (logic === 'not-selected') {
            const multiple = selectionIds.length > 1 && count === 1;
            if (!(questionAnswer && questionAnswer.answer)) {
                if (multiple) {
                    return { multiple, indices: _.range(0, selectionIds.length) };
                } else {
                    return { multiple, indices: _.range(1, count + 1) };
                }
            }
            const offset = multiple ? 0 : 1;
            const ids = new Set(questionAnswer.answer.choices.map(choice => choice.id));
            const indices = selectionIds.reduce((r, id, index) => {
                if (!ids.has(id)) {
                    r.push(index + offset);
                }
                return r;
            }, []);
            return { multiple, maxCount: selectionIds.length, indices };
        }
        return { multiple: false, indices: [] };
    }

    getSurveyAnswerRules(surveyId) {
        const where = { surveyId };
        const attributes = ['id', 'logic', 'questionId', 'answerQuestionId', 'skipCount'];
        const include = [{ model: Question, as: 'question', attributes: ['type'] }];
        return AnswerRule.findAll({ raw: true, where, attributes, include })
            .then(answerRules => {
                if (answerRules.length < 1) {
                    return answerRules;
                }
                const rules = {};
                const ruleIds = [];
                const result = answerRules.map(answerRule => {
                    const { id, logic, questionId, answerQuestionId, skipCount } = answerRule;
                    const ruleType = skipCount === null ? 'enableWhen' : 'skip';
                    const rule = { rule: { id, logic }, type: answerRule['question.type'] };
                    ruleIds.push(id);
                    rules[id] = rule;
                    const ruleInfo = { questionId, ruleType, rule };
                    if (ruleType === 'skip') {
                        ruleInfo.rule.count = skipCount;
                    } else {
                        ruleInfo.rule.questionId = answerQuestionId;
                    }
                    return ruleInfo;
                });
                return AnswerRuleValue.findAll({
                        where: { ruleId: { $in: ruleIds } },
                        attributes: ['ruleId', 'questionChoiceId', 'value'],
                        raw: true,
                        include: [{ model: QuestionChoice, as: 'questionChoice', attributes: ['type'] }]
                    })
                    .then(answerRuleValues => {
                        if (answerRuleValues.length) {
                            answerRuleValues.forEach(answer => {
                                if (answer['questionChoice.type']) {
                                    answer.choiceType = answer['questionChoice.type'];
                                }
                                delete answer['questionChoice.type'];
                            });
                            const groupedResult = _.groupBy(answerRuleValues, 'ruleId');
                            ruleIds.forEach(ruleId => {
                                const entries = groupedResult[ruleId];
                                if (entries) {
                                    const { rule, type } = rules[ruleId];
                                    if (rule.logic === 'not-selected') {
                                        rule.selectionIds = entries.map(entry => entry.questionChoiceId);
                                    } else {
                                        rule.answer = answerCommon.generateAnswer(type, entries);
                                    }
                                }
                            });
                        }
                        ruleIds.forEach(ruleId => {
                            delete rules[ruleId].type;
                        });
                        return result;
                    });
            });
    }
};
