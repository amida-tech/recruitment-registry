'use strict';

const _ = require('lodash');

const db = require('../db');
const answerCommon = require('./answer-common');

const SurveyQuestion = db.SurveyQuestion;
const Question = db.Question;
const QuestionChoice = db.QuestionChoice;
const AnswerRule = db.AnswerRule;
const AnswerRuleValue = db.AnswerRuleValue;

const rearrangeSkip = function (surveyQuestion, rules, ruleIds) {
    const ruleId = surveyQuestion['skip.id'];
    if (ruleId) {
        const count = surveyQuestion.skipCount;
        const rule = {
            id: ruleId,
            logic: surveyQuestion['skip.logic']
        };
        surveyQuestion.skip = { count, rule };
        rules[ruleId] = { rule, type: surveyQuestion['question.type'] };
        ruleIds.push(ruleId);
    }
    delete surveyQuestion.skipCount;
    delete surveyQuestion['skip.id'];
    delete surveyQuestion['skip.logic'];
};

const rearrangeEnableWhen = function (surveyQuestion, rules, ruleIds) {
    const ruleId = surveyQuestion['enableWhen.id'];
    if (ruleId) {
        const questionId = surveyQuestion.enableWhenQuestionId;
        const rule = {
            id: ruleId,
            logic: surveyQuestion['enableWhen.logic']
        };
        surveyQuestion.enableWhen = { questionId, rule };
        rules[ruleId] = { rule, type: surveyQuestion['question.type'] };
        ruleIds.push(ruleId);
    }
    delete surveyQuestion.enableWhenQuestionId;
    delete surveyQuestion['enableWhen.id'];
    delete surveyQuestion['enableWhen.logic'];
};

module.exports = class SurveyQuestionsDAO {
    constructor() {}

    listSurveyQuestions(surveyId) {
        const options = {
            where: { surveyId },
            raw: true,
            attributes: ['questionId', 'required', 'skipCount', 'enableWhenQuestionId'],
            order: 'line',
            include: [
                { model: AnswerRule, as: 'skip', attributes: ['id', 'logic'] },
                { model: AnswerRule, as: 'enableWhen', attributes: ['id', 'logic'] },
                { model: Question, as: 'question', attributes: ['type'] }
            ]
        };
        return SurveyQuestion.findAll(options)
            .then(surveyQuestions => {
                const rules = {};
                const ruleIds = [];
                surveyQuestions.forEach(surveyQuestion => {
                    rearrangeSkip(surveyQuestion, rules, ruleIds);
                    rearrangeEnableWhen(surveyQuestion, rules, ruleIds);
                    delete surveyQuestion['question.type'];
                });
                if (ruleIds.length) {
                    return AnswerRuleValue.findAll({
                            where: { ruleId: { $in: ruleIds } },
                            attributes: ['ruleId', 'questionChoiceId', 'value'],
                            raw: true,
                            include: [{ model: QuestionChoice, as: 'questionChoice', attributes: ['type'] }]
                        })
                        .then(result => {
                            if (result.length) {
                                result.forEach(answer => {
                                    if (answer['questionChoice.type']) {
                                        answer.choiceType = answer['questionChoice.type'];
                                    }
                                    delete answer['questionChoice.type'];
                                });
                                const groupedResult = _.groupBy(result, 'ruleId');
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
                            return surveyQuestions;
                        });
                }
                return surveyQuestions;
            });

    }
};
