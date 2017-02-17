'use strict';

const _ = require('lodash');
const db = require('../db');
const answerCommon = require('./answer-common');

const AnswerRule = db.AnswerRule;
const AnswerRuleValue = db.AnswerRuleValue;
const Question = db.Question;
const QuestionChoice = db.QuestionChoice;
const SurveySectionQuestion = db.SurveySectionQuestion;

module.exports = class AnswerRuleDAO {
    constructor() {}

    getSurveyAnswerRules(surveyId) {
        const where = { surveyId };
        const attributes = ['id', 'logic', 'questionId', 'answerQuestionId', 'surveySectionId'];
        const include = [
            { model: Question, as: 'question', attributes: ['type'] },
            { model: Question, as: 'answerQuestion', attributes: ['type'] },
        ];
        return AnswerRule.findAll({ raw: true, where, attributes, include })
            .then(answerRules => {
                if (answerRules.length < 1) {
                    return answerRules;
                }
                const rules = {};
                const ruleIds = [];
                const result = answerRules.map(answerRule => {
                    const { id, logic, questionId, answerQuestionId, surveySectionId } = answerRule;
                    const ruleType = 'enableWhen';
                    const questionType = answerRule['answerQuestion.type'];
                    const rule = { rule: { id, logic }, type: questionType };
                    ruleIds.push(id);
                    rules[id] = rule;
                    const ruleInfo = { questionId, surveySectionId, ruleType, rule };
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

    getQuestionExpandedSurveyAnswerRules(surveyId) {
        return this.getSurveyAnswerRules(surveyId)
            .then(answerRules => {
                const surveySectionIds = answerRules.reduce((r, { surveySectionId }) => {
                    if (surveySectionId !== undefined) {
                        r.push(surveySectionId);
                    }
                    return r;
                }, []);
                if (surveySectionIds.length) {
                    return SurveySectionQuestion.findAll({
                            where: { surveySectionId: { $in: surveySectionIds } },
                            attributes: ['questionId', 'surveySectionId'],
                            raw: true
                        })
                        .then(surveySectionQuestions => {
                            const map = surveySectionQuestions.reduce((r, surveySectionQuestion) => {
                                let questions = r.get(surveySectionQuestion.surveySectionId);
                                if (!questions) {
                                    questions = [];
                                    r.set(surveySectionQuestion.surveySectionId, questions);
                                }
                                questions.push(surveySectionQuestion.questionId);
                                return r;
                            }, new Map());
                            const additionalAnswerRules = answerRules.reduce((r, answerRule) => {
                                if (answerRule.surveySectionId) {
                                    const questions = map.get(answerRule.surveySectionId);
                                    questions.forEach(questionId => {
                                        const newAnswerRule = _.cloneDeep(answerRule);
                                        newAnswerRule.questionId = questionId;
                                        r.push(newAnswerRule);
                                    });
                                }
                                return r;
                            }, []);
                            if (additionalAnswerRules.length) {
                                answerRules.push(...additionalAnswerRules);
                            }
                            return answerRules;
                        });
                } else {
                    return answerRules;
                }
            })
            .then(answerRules => {
                const enableWhenAnswerRuleInfos = answerRules.filter(answerRule => answerRule.questionId && (answerRule.ruleType === 'enableWhen'));
                const enableWhenRulesByQuestionId = _.keyBy(enableWhenAnswerRuleInfos, 'questionId');
                return enableWhenRulesByQuestionId;
            });
    }
};
