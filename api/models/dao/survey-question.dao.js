'use strict';

const _ = require('lodash');

const db = require('../db');
const answerCommon = require('./answer-common');

const SurveyQuestion = db.SurveyQuestion;
const Question = db.Question;
const QuestionChoice = db.QuestionChoice;
const AnswerRule = db.AnswerRule;
const AnswerRuleValue = db.AnswerRuleValue;

module.exports = class SurveyQuestionsDAO {
    constructor() {}

    listSurveyQuestions(surveyId) {
        const options = {
            where: { surveyId },
            raw: true,
            attributes: ['questionId', 'required', 'skipCount'],
            order: 'line',
            include: [
                { model: AnswerRule, as: 'skip', attributes: ['id', 'logic'] },
                { model: Question, as: 'question', attributes: ['type'] }
            ]
        };
        return SurveyQuestion.findAll(options)
            .then(surveyQuestions => {
                const rules = {};
                const ruleIds = [];
                surveyQuestions.forEach(surveyQuestion => {
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
                                        rule.answer = answerCommon.generateAnswer(type, entries);
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
