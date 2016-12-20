'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const Translatable = require('./translatable');
const exportCSVConverter = require('../../export/csv-converter.js');
const importCSVConverter = require('../../import/csv-converter.js');

const sequelize = db.sequelize;
const Survey = db.Survey;
const SurveyQuestion = db.SurveyQuestion;
const ProfileSurvey = db.ProfileSurvey;
const AnswerRule = db.AnswerRule;
const AnswerRuleValue = db.AnswerRuleValue;
const Question = db.Question;

module.exports = class SurveyDAO extends Translatable {
    constructor(dependencies) {
        super('survey_text', 'surveyId', ['name', 'description'], { description: true });
        Object.assign(this, dependencies);
    }

    createNewQuestionsTx(questions, tx) {
        const newQuestions = questions.reduce((r, qx, index) => {
            if (!qx.id) {
                r.push({ qx, index });
            }
            return r;
        }, []);
        if (newQuestions.length) {
            return SPromise.all(newQuestions.map(q => {
                    return this.question.createQuestionTx(q.qx, tx)
                        .then(({ id, choices }) => {
                            const inputQuestion = questions[q.index];
                            questions[q.index] = { id, required: inputQuestion.required };
                            let skip = inputQuestion.skip;
                            if (skip) {
                                skip = _.cloneDeep(skip);
                                const choiceText = _.get(skip, 'rule.answer.choice');
                                if (choiceText) {
                                    if (!choices) {
                                        return RRError.reject('surveySkipChoiceForNonChoice');
                                    }
                                    const serverChoice = choices.find(choice => choice.text === choiceText);
                                    if (!serverChoice) {
                                        return RRError.reject('surveySkipChoiceNotFound');
                                    }
                                    const skipWithId = Object.assign({}, skip);
                                    skipWithId.rule.answer.choice = serverChoice.id;
                                    questions[q.index].skip = skipWithId;
                                    return;
                                }
                                const rawChoices = _.get(skip, 'rule.answer.choices');
                                if (rawChoices) {
                                    if (!choices) {
                                        return RRError.reject('surveySkipChoiceForNonChoice');
                                    }
                                    const skipWithId = Object.assign({}, skip);
                                    skipWithId.rule.answer.choices.forEach(skipChoice => {
                                        const serverChoice = choices.find(choice => choice.text === skipChoice.text);
                                        if (!serverChoice) {
                                            throw new RRError('surveySkipChoiceNotFound');
                                        }
                                        skipChoice.id = serverChoice.id;
                                        delete skipChoice.text;
                                    });
                                    questions[q.index].skip = skipWithId;
                                    return;
                                }
                                questions[q.index].skip = skip;
                            }
                        });
                }))
                .then(() => questions);
        } else {
            return SPromise.resolve(questions);
        }
    }

    updateQuestionsTx(inputQxs, surveyId, transaction) {
        const questions = inputQxs.slice();
        return this.createNewQuestionsTx(questions, transaction)
            .then((questions) => {
                return SPromise.all(questions.map((qx, line) => {
                    const record = { questionId: qx.id, surveyId, line, required: Boolean(qx.required) };
                    if (qx.skip) {
                        record.skipCount = qx.skip.count;
                        const rule = qx.skip.rule;
                        return AnswerRule.create({ logic: rule.logic }, { transaction })
                            .then(({ id: ruleId }) => {
                                record.skipRuleId = ruleId;
                                return SurveyQuestion.create(record, { transaction })
                                    .then(() => {
                                        if (rule.answer) {
                                            let dbAnswers = this.answer.toDbAnswer(rule.answer);
                                            const pxs = dbAnswers.map(({ questionChoiceId, value, type }) => {
                                                questionChoiceId = questionChoiceId || null;
                                                value = (value !== undefined ? value : null);
                                                return AnswerRuleValue.create({ ruleId, questionChoiceId, value, type }, { transaction });
                                            });
                                            return SPromise.all(pxs);
                                        }
                                    });
                            });
                    } else {
                        return SurveyQuestion.create(record, { transaction });
                    }
                }));
            });
    }

    createSurveyTx(survey, tx) {
        if (!(survey.questions && survey.questions.length)) {
            return RRError.reject('surveyNoQuestions');
        }
        const fields = _.omit(survey, ['name', 'description', 'sections', 'questions']);
        return Survey.create(fields, { transaction: tx })
            .then(({ id }) => this.createTextTx({ id, name: survey.name, description: survey.description }, tx))
            .then(({ id }) => {
                return this.updateQuestionsTx(survey.questions, id, tx)
                    .then(() => id);
            })
            .then(id => {
                if (survey.sections) {
                    return this.section.bulkCreateSectionsForSurveyTx(id, survey.sections, tx)
                        .then(() => id);
                } else {
                    return id;
                }
            });
    }

    createSurvey(survey) {
        return sequelize.transaction(tx => {
            return this.createSurveyTx(survey, tx);
        });
    }

    replaceSurveySections(id, sections) {
        return sequelize.transaction(tx => {
            return this.section.bulkCreateSectionsForSurveyTx(id, sections, tx);
        });
    }

    updateSurveyTextTx({ id, name, description, sections }, language, tx) {
        return this.createTextTx({ id, name, description, language }, tx)
            .then(() => {
                if (sections) {
                    return this.section.updateMultipleSectionNamesTx(sections, language, tx);
                }
            });
    }

    updateSurveyText({ id, name, description, sections }, language) {
        return sequelize.transaction(tx => {
            return this.updateSurveyTextTx({ id, name, description, sections }, language, tx);
        });
    }

    updateSurvey(id, surveyUpdate) {
        return Survey.update(surveyUpdate, { where: { id } });
    }

    replaceSurveyTx(id, replacement, transaction) {
        return Survey.findById(id)
            .then(survey => {
                if (!survey) {
                    return RRError.reject('surveyNotFound');
                }
                return survey;
            })
            .then(survey => {
                const version = survey.version || 1;
                const newSurvey = Object.assign({
                    version: version + 1,
                    groupId: survey.groupId || survey.id
                }, replacement);
                return this.createSurveyTx(newSurvey, transaction)
                    .then((id) => {
                        if (!survey.version) {
                            return survey.update({ version: 1, groupId: survey.id }, { transaction })
                                .then(() => id);
                        }
                        return id;
                    })
                    .then((id) => {
                        return survey.destroy({ transaction })
                            .then(() => SurveyQuestion.destroy({ where: { surveyId: survey.id }, transaction }))
                            .then(() => ProfileSurvey.destroy({ where: { surveyId: survey.id }, transaction }))
                            .then(() => ProfileSurvey.create({ surveyId: id }, { transaction }))
                            .then(() => id);
                    });
            });
    }

    replaceSurvey(id, replacement) {
        if (!_.get(replacement, 'questions.length')) {
            return RRError.reject('surveyNoQuestions');
        }
        return sequelize.transaction(tx => {
            return this.replaceSurveyTx(id, replacement, tx);
        });
    }

    createOrReplaceSurvey(input) {
        const survey = _.omit(input, 'parentId');
        const parentId = input.parentId;
        if (parentId) {
            return this.replaceSurvey(parentId, survey);
        } else {
            return this.createSurvey(survey);
        }
    }

    deleteSurvey(id) {
        return sequelize.transaction(transaction => {
            return Survey.destroy({ where: { id }, transaction })
                .then(() => SurveyQuestion.destroy({ where: { surveyId: id }, transaction }))
                .then(() => ProfileSurvey.destroy({ where: { surveyId: id }, transaction }));
        });
    }

    listSurveys({ scope, language, history, where, order, groupId, version } = {}) {
        const attributes = ['id'];
        if (scope === 'version-only' || scope === 'version') {
            attributes.push('groupId');
            attributes.push('version');
        }
        const options = { raw: true, attributes, order: order || 'id', paranoid: !history };
        if (groupId || version) {
            options.where = {};
            if (groupId) {
                options.where.groupId = groupId;
            }
            if (version) {
                options.where.version = version;
            }
        }
        if (language) {
            options.language = language;
        }
        if (scope === 'version-only') {
            return Survey.findAll(options);
        }
        return Survey.findAll(options)
            .then(surveys => this.updateAllTexts(surveys, options.language))
            .then(surveys => {
                if (scope === 'export') {
                    return SurveyQuestion.findAll({
                            raw: true,
                            attributes: ['surveyId', 'questionId', 'required'],
                            order: 'line'
                        })
                        .then(surveyQuestions => {
                            return surveyQuestions.reduce((r, qx) => {
                                const p = r.get(qx.surveyId);
                                if (!p) {
                                    r.set(qx.surveyId, [{ id: qx.questionId, required: qx.required }]);
                                    return r;
                                }
                                p.push({ id: qx.questionId, required: qx.required });
                                return r;
                            }, new Map());
                        })
                        .then(map => {
                            surveys.forEach(survey => {
                                survey.questions = map.get(survey.id);
                            });
                            return surveys;
                        });

                }
                return surveys;
            });
    }

    getSurvey(id, options = {}) {
        let _options = { where: { id }, raw: true, attributes: ['id', 'meta'] };
        if (options.override) {
            _options = _.assign({}, _options, options.override);
        }
        return Survey.findOne(_options)
            .then(survey => {
                if (!survey) {
                    return RRError.reject('surveyNotFound');
                }
                if (survey.meta === null) {
                    delete survey.meta;
                }
                return this.updateText(survey, options.language)
                    .then(() => SurveyQuestion.findAll({
                            where: { surveyId: id },
                            raw: true,
                            attributes: ['questionId', 'required', 'skipCount'],
                            order: 'line',
                            include: [
                                { model: AnswerRule, as: 'skip', attributes: ['id', 'logic'] },
                                { model: Question, as: 'question', attributes: ['type'] }
                            ]
                        })
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
                                        attributes: ['ruleId', 'questionChoiceId', 'value', 'type'],
                                        raw: true
                                    })
                                    .then(result => {
                                        if (result.length) {
                                            const groupedResult = _.groupBy(result, 'ruleId');
                                            ruleIds.forEach(ruleId => {
                                                const entries = groupedResult[ruleId];
                                                const { rule, type } = rules[ruleId];
                                                rule.answer = this.answer.toInterfaceAnswer(type, entries);
                                            });
                                        }
                                        return surveyQuestions;
                                    });
                            }
                            return surveyQuestions;
                        })
                        .then(surveyQuestions => {
                            const ids = _.map(surveyQuestions, 'questionId');
                            const language = options.language;
                            return this.question.listQuestions({ scope: 'complete', ids, language })
                                .then(questions => {
                                    const qxMap = _.keyBy(questions, 'id');
                                    const qxs = surveyQuestions.map(surveyQuestion => {
                                        const result = Object.assign(qxMap[surveyQuestion.questionId], { required: surveyQuestion.required });
                                        if (surveyQuestion.skip) {
                                            result.skip = surveyQuestion.skip;
                                        }
                                        return result;
                                    });
                                    survey.questions = qxs;
                                    return survey;
                                });
                        }))
                    .then(() => {
                        return this.section.getSectionsForSurveyTx(survey.id, options.language)
                            .then((sections) => {
                                if (sections && sections.length) {
                                    survey.sections = sections;
                                }
                                return survey;
                            });
                    });
            });
    }

    getAnsweredSurvey(userId, id, options) {
        return this.getSurvey(id, options)
            .then(survey => {
                return this.answer.getAnswers({
                        userId,
                        surveyId: survey.id
                    })
                    .then(answers => {
                        const qmap = _.keyBy(survey.questions, 'id');
                        answers.forEach(answer => {
                            const qid = answer.questionId;
                            const question = qmap[qid];
                            question.language = answer.language;
                            question.answer = answer.answer;
                        });
                        return survey;
                    });
            });
    }

    export () {
        return this.listSurveys({ scope: 'export' })
            .then(surveys => {
                return surveys.reduce((r, { id, name, description, questions }) => {
                    const surveyLine = { id, name, description };
                    questions.forEach(({ id, required }, index) => {
                        const line = { questionId: id, required };
                        if (index === 0) {
                            Object.assign(line, surveyLine);
                        } else {
                            line.id = surveyLine.id;
                        }
                        r.push(line);
                    });
                    return r;
                }, []);
            })
            .then(lines => {
                const converter = new exportCSVConverter({ fields: ['id', 'name', 'description', 'questionId', 'required'] });
                return converter.dataToCSV(lines);
            });
    }

    import (stream, questionIdMap) {
        questionIdMap = _.toPairs(questionIdMap).reduce((r, pair) => {
            r[pair[0]] = pair[1].questionId;
            return r;
        }, {});
        const converter = new importCSVConverter();
        return converter.streamToRecords(stream)
            .then(records => {
                const numRecords = records.length;
                if (!numRecords) {
                    return [];
                }
                const map = records.reduce((r, record) => {
                    const id = record.id;
                    let { survey } = r.get(id) || {};
                    if (!survey) {
                        survey = { name: record.name };
                        if (record.description) {
                            survey.description = record.description;
                        }
                        r.set(id, { id, survey });
                    }
                    if (!survey.questions) {
                        survey.questions = [];
                    }
                    const question = {
                        id: questionIdMap[record.questionId],
                        required: record.required
                    };
                    survey.questions.push(question);
                    return r;
                }, new Map());
                return [...map.values()];
            })
            .then(records => {
                if (!records.length) {
                    return {};
                }
                return sequelize.transaction(transaction => {
                    const mapIds = {};
                    const pxs = records.map(({ id, survey }) => {
                        return this.createSurveyTx(survey, transaction)
                            .then(surveyId => mapIds[id] = surveyId);
                    });
                    return SPromise.all(pxs).then(() => mapIds);
                });
            });
    }
};
