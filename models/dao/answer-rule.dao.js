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
        const attributes = ['id', 'logic', 'questionId', 'answerQuestionId', 'skipCount', 'surveySectionId'];
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
                    const { id, logic, questionId, answerQuestionId, skipCount, surveySectionId } = answerRule;
                    const ruleType = skipCount === null ? 'enableWhen' : 'skip';
                    const questionType = skipCount === null ? answerRule['answerQuestion.type'] : answerRule['question.type'];
                    const rule = { rule: { id, logic }, type: questionType };
                    ruleIds.push(id);
                    rules[id] = rule;
                    const ruleInfo = { questionId, surveySectionId, ruleType, rule };
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
