'use strict';

const _ = require('lodash');
const db = require('../db');
const answerCommon = require('./answer-common');
const SPromise = require('../../lib/promise');

const AnswerRule = db.AnswerRule;
const AnswerRuleValue = db.AnswerRuleValue;
const Question = db.Question;
const QuestionChoice = db.QuestionChoice;
const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

module.exports = class AnswerRuleDAO {
    getSurveyAnswerRules({ surveyId }) {
        const where = { surveyId };
        const attributes = ['id', 'logic', 'questionId', 'answerQuestionId', 'sectionId'];
        const include = [
            { model: Question, as: 'question', attributes: ['type'] },
            { model: Question, as: 'answerQuestion', attributes: ['type'] },
        ];
        return AnswerRule.findAll({ raw: true, where, attributes, include, order: 'line' })
            .then((answerRules) => {
                if (answerRules.length < 1) {
                    return answerRules;
                }
                const rules = {};
                const ruleIds = [];
                const result = answerRules.map((answerRule) => {
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
                    include: [{ model: QuestionChoice, as: 'questionChoice', attributes: ['type'] }],
                })
                    .then((answerRuleValues) => {
                        if (answerRuleValues.length) {
                            answerRuleValues.forEach((answer) => {
                                if (answer['questionChoice.type']) {
                                    answer.choiceType = answer['questionChoice.type'];
                                }
                                delete answer['questionChoice.type'];
                            });
                            const groupedResult = _.groupBy(answerRuleValues, 'ruleId');
                            ruleIds.forEach((ruleId) => {
                                const entries = groupedResult[ruleId];
                                if (entries) {
                                    const rule = rules[ruleId];
                                    rule.answer = answerCommon.generateAnswer(rule.type, entries);
                                }
                            });
                        }
                        ruleIds.forEach((ruleId) => {
                            delete rules[ruleId].type;
                        });
                        return result;
                    });
            });
    }

    getQuestionExpandedSurveyAnswerRules(surveyId) {
        return this.getSurveyAnswerRules({ surveyId })
            .then((answerRules) => {
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

    exportAnswerRules() {
        const attributes = ['id', 'surveyId', 'logic', 'questionId', 'answerQuestionId', 'sectionId'];
        return AnswerRule.findAll({ raw: true, attributes, order: ['surveyId', 'line'] })
            .then((answerRules) => {
                if (answerRules.length < 1) {
                    return answerRules;
                }
                const ruleIds = answerRules.map(answerRule => answerRule.id);
                return AnswerRuleValue.findAll({
                    where: { ruleId: { $in: ruleIds } },
                    attributes: ['ruleId', 'questionChoiceId', 'value'],
                    raw: true,
                    order: 'id',
                })
                    .then(answerRuleValues => answerRuleValues.reduce((r, { ruleId, questionChoiceId, value }) => {
                        let current = r.get(ruleId);
                        if (!current) {
                            current = [];
                            r.set(ruleId, current);
                        }
                        current.push({ questionChoiceId, value });
                        return r;
                    }, new Map()))
                    .then(valueMap => answerRules.reduce((r, rule) => {
                        const values = valueMap.get(rule.id);
                        if (values) {
                            values.forEach((value) => {
                                Object.assign(value, rule);
                                r.push(value);
                            });
                        } else {
                            r.push(rule);
                        }
                        return r;
                    }, []));
            })
            .then((lines) => {
                const converter = new ExportCSVConverter();
                return converter.dataToCSV(lines);
            });
    }

    importAnswerRules(stream, { sectionIdMap, questionIdMap, surveyIdMap }) {
        const converter = new ImportCSVConverter();
        return converter.streamToRecords(stream)
            .then((records) => {
                const ruleIdMap = new Map();
                const rules = records.reduce((r, record, line) => {
                    if (ruleIdMap.has(record.id)) {
                        return r;
                    }
                    const rule = { id: record.id, logic: record.logic, line };
                    rule.surveyId = surveyIdMap[record.surveyId];
                    if (record.questionId) {
                        rule.questionId = questionIdMap[record.questionId].questionId;
                    }
                    if (record.answerQuestionId) {
                        rule.answerQuestionId = questionIdMap[record.answerQuestionId].questionId;
                    }
                    if (record.sectionId) {
                        rule.sectionId = sectionIdMap[record.sectionId];
                    }
                    r.push(rule);
                    return r;
                }, []);
                const ruleValues = records.reduce((r, record, line) => {
                    const { id, value, questionChoiceId } = record;
                    if (value || questionChoiceId) {
                        r.push({ id, value, questionChoiceId, line });
                    }
                    return r;
                }, []);
                return { rules, ruleValues };
            })
            .then(({ rules, ruleValues }) => {
                if (!rules.length) {
                    return null;
                }
                return db.sequelize.transaction((transaction) => {
                    const ruleIdMap = new Map();
                    const promises = rules.map((rule) => {
                        const record = _.omit(rule, 'id');
                        return AnswerRule.create(record, { transaction })
                            .then(({ id }) => ruleIdMap.set(rule.id, id));
                    });
                    return SPromise.all(promises)
                        .then(() => {
                            const promises2 = ruleValues.map((ruleValue) => {
                                const record = { line: ruleValue.line };
                                if (ruleValue.value || ruleValue.value === 0) {
                                    record.value = ruleValue.value;
                                }
                                if (ruleValue.questionChoiceId) {
                                    record.questionChoiceId = ruleValue.questionChoiceId;
                                }
                                record.ruleId = ruleIdMap.get(ruleValue.id);
                                return AnswerRuleValue.create(record, { transaction });
                            });
                            return SPromise.all(promises2).then(() => ruleIdMap)
                                .then(ruleIdMap => [...ruleIdMap].reduce((r, [key, value]) => {
                                    r[key] = value;
                                    return r;
                                }, {}));
                        });
                });
            });
    }
};
