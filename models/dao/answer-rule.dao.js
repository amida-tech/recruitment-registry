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

    getSurveyAnswerRules(surveyId) {
        const where = { surveyId };
        const attributes = ['id', 'logic', 'questionId', 'answerQuestionId', 'sectionId'];
        const include = [
            { model: Question, as: 'question', attributes: ['type'] },
            { model: Question, as: 'answerQuestion', attributes: ['type'] },
        ];
        return AnswerRule.findAll({ raw: true, where, attributes, include, order: 'line' })
            .then(answerRules => {
                if (answerRules.length < 1) {
                    return answerRules;
                }
                const rules = {};
                const ruleIds = [];
                const result = answerRules.map(answerRule => {
                    const { id, logic, questionId, answerQuestionId, sectionId } = answerRule;
                    const questionType = answerRule['answerQuestion.type'];
                    const rule = { id, logic, type: questionType };
                    ruleIds.push(id);
                    rules[id] = rule;
                    const ruleInfo = { questionId, sectionId, rule };
                    ruleInfo.rule.questionId = answerQuestionId;
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
                                    const rule = rules[ruleId];
                                    rule.answer = answerCommon.generateAnswer(rule.type, entries);
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

    getQuestionExpandedSurveyAnswerRules(surveyId) {
        return this.getSurveyAnswerRules(surveyId)
            .then(answerRules => {
                if (!answerRules.length) {
                    return { sectionAnswerRulesMap: null, questionAnswerRulesMap: null };
                }
                return answerRules.reduce((r, answerRule) => {
                    const { sectionAnswerRulesMap, questionAnswerRulesMap } = r;
                    const { sectionId, questionId, rule } = answerRule;
                    if (sectionId) {
                        let sectionRules = sectionAnswerRulesMap.get(sectionId);
                        if (!sectionRules) {
                            sectionRules = [];
                            sectionAnswerRulesMap.set(sectionId, sectionRules);
                        }
                        sectionRules.push(rule);
                        return r;
                    }
                    if (questionId) {
                        let questionRules = questionAnswerRulesMap.get(questionId);
                        if (!questionRules) {
                            questionRules = [];
                            questionAnswerRulesMap.set(questionId, questionRules);
                        }
                        questionRules.push(rule);
                        return r;
                    }
                    return r;
                }, { sectionAnswerRulesMap: new Map(), questionAnswerRulesMap: new Map() });
            });
    }
};
