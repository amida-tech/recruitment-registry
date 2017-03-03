'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const queryrize = require('../../lib/queryrize');
const Translatable = require('./translatable');
const exportCSVConverter = require('../../export/csv-converter.js');
const importCSVConverter = require('../../import/csv-converter.js');

const sequelize = db.sequelize;
const Survey = db.Survey;
const SurveyQuestion = db.SurveyQuestion;
const ProfileSurvey = db.ProfileSurvey;
const AnswerRule = db.AnswerRule;
const AnswerRuleValue = db.AnswerRuleValue;
const Answer = db.Answer;

const surveyPatchInfoQuery = queryrize.readQuerySync('survey-patch-info.sql');

const translateRuleChoices = function (ruleParent, choices) {
    const choiceText = _.get(ruleParent, 'answer.choiceText');
    const rawChoices = _.get(ruleParent, 'answer.choices');
    if (choiceText || rawChoices) {
        if (!choices) {
            return RRError.reject('surveySkipChoiceForNonChoice');
        }
        if (choiceText) {
            const serverChoice = choices.find(choice => choice.text === choiceText);
            if (!serverChoice) {
                return RRError.reject('surveySkipChoiceNotFound');
            }
            ruleParent.answer.choice = serverChoice.id;
            delete ruleParent.answer.choiceText;
        }
        if (rawChoices) {
            ruleParent.answer.choices.forEach(ruleParentChoice => {
                const serverChoice = choices.find(choice => choice.text === ruleParentChoice.text);
                if (!serverChoice) {
                    throw new RRError('surveySkipChoiceNotFound');
                }
                ruleParentChoice.id = serverChoice.id;
            });
            ruleParent.answer.choices.forEach(ruleParentChoice => delete ruleParentChoice.text);
        }
        return ruleParent;
    }
    return null;
};

module.exports = class SurveyDAO extends Translatable {
    constructor(dependencies) {
        super('survey_text', 'surveyId', ['name', 'description'], { description: true });
        Object.assign(this, dependencies);
    }

    flattenSectionsHieararchy(sections, result, parentIndex) {
        sections.forEach((section, line) => {
            let { id, name, questions, enableWhen } = section;
            const sectionInfo = { name, parentIndex, line };
            if (id) {
                sectionInfo.id = id;
            }
            if (enableWhen) {
                sectionInfo.enableWhen = enableWhen;
            }
            result.sections.push(sectionInfo);
            if (questions) {
                const indices = this.flattenQuestionsHierarchy(questions, result);
                sectionInfo.indices = indices;
            }
            if (section.sections) {
                const parentIndex = result.sections.length ? result.sections.length - 1 : null;
                this.flattenSectionsHieararchy(section.sections, result, parentIndex);
            }
        });
        return result;
    }

    flattenQuestionsHierarchy(questions, result) {
        const indices = [];
        questions.forEach(question => {
            const questionIndex = result.questions.length;
            indices.push(questionIndex);
            result.questions.push(question);
            const questionSections = question.sections;
            if (questionSections) {
                questionSections.forEach((section, line) => {
                    let { id, name, sections, questions, enableWhen } = section;
                    const sectionInfo = { name, questionIndex, line };
                    if (id) {
                        sectionInfo.id = id;
                    }
                    if (enableWhen) {
                        sectionInfo.enableWhen = enableWhen;
                    }
                    result.sections.push(sectionInfo);
                    if (questions) {
                        const indices = this.flattenQuestionsHierarchy(questions, result);
                        sectionInfo.indices = indices;
                    }
                    if (sections) {
                        const parentIndex = result.sections.length ? result.sections.length - 1 : null;
                        this.flattenSectionsHieararchy(sections, result, parentIndex);
                    }
                });
            }
        });
        return indices;
    }

    flattenHierarchy({ sections, questions }) {
        if (questions && sections) {
            throw new RRError('surveyBothQuestionsSectionsSpecified');
        }
        if (!questions && !sections) {
            throw new RRError('surveyNeitherQuestionsSectionsSpecified');
        }
        const result = { sections: [], questions: [] };
        if (sections) {
            return this.flattenSectionsHieararchy(sections, result, null);
        }
        this.flattenQuestionsHierarchy(questions, result);
        if (result.sections.length === 0) {
            delete result.sections;
        }
        return result;
    }

    createRuleAnswerValue(ruleParent, transaction) {
        if (!ruleParent) {
            return null;
        }
        const rule = ruleParent;
        const ruleId = ruleParent.ruleId;
        if (rule.answer) {
            let dbAnswers = this.answer.toDbAnswer(rule.answer);
            const pxs = dbAnswers.map(({ questionChoiceId, value }) => {
                questionChoiceId = questionChoiceId || null;
                value = (value !== undefined ? value : null);
                return AnswerRuleValue.create({ ruleId, questionChoiceId, value }, { transaction });
            });
            return SPromise.all(pxs);
        }
        return null;
    }

    createNewQuestionsTx(questions, tx) {
        const newQuestions = questions.reduce((r, qx, index) => {
            if (!qx.id) {
                r.push({ qx, index });
            }
            return r;
        }, []);
        if (newQuestions.length) {
            const questionChoices = {};
            return SPromise.all(newQuestions.map(q => {
                    return this.question.createQuestionTx(q.qx, tx)
                        .then(({ id, choices }) => {
                            const inputQuestion = questions[q.index];
                            questions[q.index] = { id, required: inputQuestion.required };
                            questionChoices[id] = choices;
                            let enableWhen = inputQuestion.enableWhen;
                            if (enableWhen) {
                                enableWhen = _.cloneDeep(enableWhen);
                                questions[q.index].enableWhen = enableWhen;
                            }
                        });
                }))
                .then(() => ({ questions, questionChoices }));
        } else {
            return SPromise.resolve({ questions });
        }
    }

    createRulesForQuestions(surveyId, questions, transaction) {
        const questionsWithRule = questions.filter(question => question.enableWhen);
        if (questionsWithRule.length) {
            const promises = questionsWithRule.reduce((r, question) => {
                question.enableWhen.forEach((rule, line) => {
                    const answerRule = { surveyId, questionId: question.id, logic: rule.logic, line };
                    answerRule.answerQuestionId = rule.questionId;
                    const promise = AnswerRule.create(answerRule, { transaction })
                        .then(({ id }) => {
                            let code = rule.answer && rule.answer.code;
                            if ((code !== null) && (code !== undefined)) {
                                return this.questionChoice.findQuestionChoiceIdForCode(answerRule.answerQuestionId, code, transaction)
                                    .then((choiceId) => {
                                        rule.answer.choice = choiceId;
                                        delete rule.answer.code;
                                        return { id };
                                    });
                            }
                            return ({ id });
                        })
                        .then(({ id }) => {
                            rule.ruleId = id;
                            return this.createRuleAnswerValue(rule, transaction);
                        });
                    r.push(promise);
                });
                return r;
            }, []);
            return SPromise.all(promises).then(() => questions);
        }
        return questions;
    }

    createRulesForSections(surveyId, sections, sectionIds, transaction) {
        const sectionsWithRule = _.range(sections.length).filter(index => sections[index].enableWhen);
        if (sectionsWithRule.length) {
            const promises = sectionsWithRule.reduce((r, index) => {
                const section = sections[index];
                const sectionId = sectionIds[index];
                section.enableWhen.forEach((rule, line) => {
                    const answerRule = { surveyId, sectionId, logic: rule.logic, line };
                    answerRule.answerQuestionId = rule.questionId;
                    const promise = AnswerRule.create(answerRule, { transaction })
                        .then(({ id }) => {
                            let code = rule.answer && rule.answer.code;
                            if ((code !== null) && (code !== undefined)) {
                                return this.questionChoice.findQuestionChoiceIdForCode(answerRule.answerQuestionId, code, transaction)
                                    .then((choiceId) => {
                                        rule.answer.choice = choiceId;
                                        delete rule.answer.code;
                                        return { id };
                                    });
                            }
                            return ({ id });
                        })
                        .then(({ id }) => {
                            rule.ruleId = id;
                            return this.createRuleAnswerValue(rule, transaction);
                        });
                    r.push(promise);
                });
                return r;
            }, []);
            return SPromise.all(promises).then(() => sections);
        }
        return sections;
    }

    translateEnableWhen(parent, questions, questionChoices) {
        let enableWhen = parent.enableWhen;
        if (enableWhen) {
            enableWhen = _.cloneDeep(enableWhen);
            parent.enableWhen = enableWhen.map(rule => {
                let questionIndex = rule.questionIndex;
                if (questionIndex !== undefined) {
                    rule.questionId = questions[questionIndex].id;
                    delete rule.questionIndex;
                }
                if (questionChoices) {
                    const choices = questionChoices[rule.questionId];
                    rule = translateRuleChoices(rule, choices) || rule;
                }
                return rule;
            });
        }
    }

    createSurveyQuestionsTx(questions, sections, surveyId, transaction) {
        questions = questions.slice();
        return this.createNewQuestionsTx(questions, transaction)
            .then(({ questions, questionChoices }) => {
                questions.forEach(question => this.translateEnableWhen(question, questions, questionChoices));
                if (sections) {
                    sections.forEach(section => this.translateEnableWhen(section, questions, questionChoices));
                }
                return questions;
            })
            .then(questions => this.createRulesForQuestions(surveyId, questions, transaction))
            .then(questions => {
                return SPromise.all(questions.map((qx, line) => {
                        const record = { questionId: qx.id, surveyId, line, required: Boolean(qx.required) };
                        return SurveyQuestion.create(record, { transaction });
                    }))
                    .then(() => questions);
            });
    }

    updateSurveyTx(id, survey, transaction) {
        let { sections, questions } = this.flattenHierarchy(survey);
        if (!questions.length) {
            return RRError.reject('surveyNoQuestions');
        }
        return this.createTextTx({ id, name: survey.name, description: survey.description }, transaction)
            .then(({ id }) => {
                return this.createSurveyQuestionsTx(questions, sections, id, transaction)
                    .then(questions => {
                        const questionIds = questions.map(question => question.id);
                        return { questionIds, surveyId: id };
                    });
            })
            .then(({ questionIds, surveyId }) => {
                if (sections) {
                    return this.surveySection.bulkCreateFlattenedSectionsForSurveyTx(surveyId, questionIds, sections, transaction)
                        .then(sectionIds => this.createRulesForSections(surveyId, sections, sectionIds, transaction))
                        .then(() => surveyId);
                } else {
                    return surveyId;
                }
            })
            .then(surveyId => {
                if (survey.identifier) {
                    const { type, value: identifier } = survey.identifier;
                    return this.surveyIdentifier.createSurveyIdentifier({ type, identifier, surveyId }, transaction)
                        .then(() => surveyId);
                }
                return surveyId;
            });
    }

    createSurveyTx(survey, transaction) {
        const fields = _.omit(survey, ['name', 'description', 'sections', 'questions', 'identifier']);
        return Survey.create(fields, { transaction }).then(({ id }) => this.updateSurveyTx(id, survey, transaction));
    }

    createSurvey(survey) {
        return sequelize.transaction(transaction => {
            return this.createSurveyTx(survey, transaction);
        });
    }

    patchSurveyTextTx({ id, name, description, sections }, language, transaction) {
        return this.createTextTx({ id, name, description, language }, transaction)
            .then(() => {
                if (sections) {
                    return this.surveySection.updateMultipleSectionNamesTx(sections, language, transaction);
                }
            });
    }

    patchSurveyText({ id, name, description, sections }, language) {
        return sequelize.transaction(transaction => {
            return this.patchSurveyTextTx({ id, name, description, sections }, language, transaction);
        });
    }

    patchSurveyInformationTx(surveyId, { name, description, sections, questions }, transaction) {
        const replacements = {
            text_needed: Boolean(name || (description !== undefined)),
            questions_needed: Boolean(questions || sections),
            sections_needed: Boolean(questions && !sections),
            survey_id: surveyId
        };
        return sequelize.query(surveyPatchInfoQuery, {
                transaction,
                replacements,
                type: sequelize.QueryTypes.SELECT
            })
            .then(surveys => {
                if (!surveys.length) {
                    return RRError.reject('surveyNotFound');
                }
                return surveys[0];
            });
    }

    patchSurveyTx(surveyId, surveyPatch, transaction) {
        return this.patchSurveyInformationTx(surveyId, surveyPatch, transaction)
            .then(survey => {
                if (!surveyPatch.forceStatus && survey.status === 'retired') {
                    return RRError.reject('surveyRetiredStatusUpdate');
                }
                return SPromise.resolve()
                    .then(() => {
                        const { status, meta, forceStatus } = surveyPatch;
                        if (status || meta) {
                            let fields = {};
                            if (status && (status !== survey.status)) {
                                if (survey.status === 'draft' && status === 'retired') {
                                    return RRError.reject('surveyDraftToRetiredUpdate');
                                }
                                if (!forceStatus && (status === 'draft') && (survey.status === 'published')) {
                                    return RRError.reject('surveyPublishedToDraftUpdate');
                                }
                                fields.status = status;
                            }
                            if (meta) {
                                if (_.isEmpty(meta)) {
                                    fields.meta = null;
                                } else {
                                    fields.meta = meta;
                                }
                            }
                            if (!_.isEmpty(fields)) {
                                return Survey.update(fields, { where: { id: surveyId }, transaction });
                            }
                        }
                    })
                    .then(() => {
                        let { name, description } = surveyPatch;
                        if (name || (description !== undefined)) {
                            name = name || survey.name;
                            if (description === '') {
                                description = null;
                            } else {
                                description = description || survey.description;
                            }
                            return this.createTextTx({ id: surveyId, name, description }, transaction);
                        }
                    })
                    .then(() => {
                        if (!(surveyPatch.questions || surveyPatch.sections)) {
                            return;
                        }
                        const { sections, questions } = this.flattenHierarchy(surveyPatch);
                        if (!questions) {
                            return RRError.reject('surveyNoQuestionsInSections');
                        }
                        const questionIdSet = new Set();
                        questions.forEach(question => {
                            const questionId = question.id;
                            if (questionId) {
                                questionIdSet.add(questionId);
                            }
                        });
                        const removedQuestionIds = survey.questionIds.reduce((r, questionId) => {
                            if (!questionIdSet.has(questionId)) {
                                r.push(questionId);
                            }
                            return r;
                        }, []);
                        if (removedQuestionIds.length || (survey.questionIds.length !== questions.length)) {
                            if (!surveyPatch.forceQuestions && (surveyPatch.status !== 'draft')) {
                                return RRError.reject('surveyChangeQuestionWhenPublished');
                            }
                        }
                        return SurveyQuestion.destroy({ where: { surveyId }, transaction })
                            .then(() => {
                                if (removedQuestionIds.length) {
                                    return Answer.destroy({ where: { surveyId, questionId: { $in: removedQuestionIds } }, transaction });
                                }
                            })
                            .then(() => this.createSurveyQuestionsTx(questions, sections, surveyId, transaction))
                            .then(questions => questions.map(question => question.id))
                            .then(questionIds => ({ sections, questionIds }))
                            .then(({ sections, questionIds }) => {
                                if (sections) {
                                    return this.surveySection.bulkCreateFlattenedSectionsForSurveyTx(surveyId, questionIds, sections, transaction);
                                } else if (survey.sectionCount) {
                                    return this.surveySection.deleteSurveySectionsTx(surveyId, transaction);
                                }
                            });
                    });
            });
    }

    patchSurvey(id, surveyPatch) {
        return sequelize.transaction(transaction => {
            return this.patchSurveyTx(id, surveyPatch, transaction);
        });
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

    listSurveys({ scope, status, language, history, where, order, groupId, version } = {}) {
        if (!status) {
            status = 'published';
        }
        const attributes = (status === 'all') ? ['id', 'status'] : ['id'];
        if (scope === 'version-only' || scope === 'version') {
            attributes.push('groupId');
            attributes.push('version');
        }
        const options = { raw: true, attributes, order: order || 'id', paranoid: !history };
        if (groupId || version || (status !== 'all')) {
            options.where = {};
            if (groupId) {
                options.where.groupId = groupId;
            }
            if (version) {
                options.where.version = version;
            }
            if (status !== 'all') {
                options.where.status = status;
            }
        }
        if (language) {
            options.language = language;
        }
        if (scope === 'version-only') {
            return Survey.findAll(options);
        }
        if (scope === 'id-only') {
            return Survey.findAll(options)
                .then(surveys => surveys.map(survey => survey.id));
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
        let _options = { where: { id }, raw: true, attributes: ['id', 'meta', 'status'] };
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
                if (options.override) {
                    return survey;
                }
                return this.answerRule.getSurveyAnswerRules(survey.id)
                    .then(answerRuleInfos => {
                        return this.updateText(survey, options.language)
                            .then(() => this.surveyQuestion.listSurveyQuestions(survey.id))
                            .then(surveyQuestions => {
                                const ids = _.map(surveyQuestions, 'questionId');
                                const language = options.language;
                                return this.question.listQuestions({ scope: 'complete', ids, language })
                                    .then(questions => {
                                        const qxMap = _.keyBy(questions, 'id');
                                        const qxs = surveyQuestions.map(surveyQuestion => {
                                            const result = Object.assign(qxMap[surveyQuestion.questionId], { required: surveyQuestion.required });
                                            return result;
                                        });
                                        answerRuleInfos.forEach(({ questionId, rule }) => {
                                            if (questionId) {
                                                const question = qxMap[questionId];
                                                if (!question.enableWhen) {
                                                    question.enableWhen = [];
                                                }
                                                question.enableWhen.push(rule);
                                            }
                                        });
                                        return { survey, questions: qxs };
                                    });
                            })
                            .then(({ survey, questions }) => {
                                return this.surveySection.getSectionsForSurveyTx(survey.id, questions, answerRuleInfos, options.language)
                                    .then(result => {
                                        if (!result) {
                                            survey.questions = questions;
                                            return survey;
                                        }
                                        const { sections, innerQuestionSet } = result;
                                        if (sections && sections.length) {
                                            survey.sections = sections;
                                        } else {
                                            survey.questions = questions.filter(({ id }) => !innerQuestionSet.has(id));
                                        }
                                        return survey;
                                    });
                            });
                    });
            });
    }

    updateQuestionQuestionsMap(questions, map) {
        questions.forEach(question => {
            map.set(question.id, question);
            if (question.sections) {
                this.updateQuestionsMap({ sections: question.sections }, map);
            }
        });
    }

    updateQuestionsMap({ questions, sections }, map) {
        if (questions) {
            return this.updateQuestionQuestionsMap(questions, map);
        }
        sections.forEach(section => {
            this.updateQuestionsMap(section, map);
        });

    }

    getQuestionsMap(survey) {
        const map = new Map();
        this.updateQuestionsMap(survey, map);
        return map;
    }

    updateQuestionQuestionsList(questions, list) {
        questions.forEach(question => {
            list.push(question);
            if (question.sections) {
                this.updateQuestionsList({ sections: question.sections }, list);
            }
        });
    }

    updateQuestionsList({ questions, sections }, list) {
        if (questions) {
            return this.updateQuestionQuestionsList(questions, list);
        }
        sections.forEach(section => {
            this.updateQuestionsList(section, list);
        });
    }

    getQuestions(survey) {
        const list = [];
        this.updateQuestionsList(survey, list);
        return list;
    }

    getAnsweredSurvey(userId, id, options) {
        return this.getSurvey(id, options)
            .then(survey => {
                return this.answer.getAnswers({
                        userId,
                        surveyId: survey.id
                    })
                    .then(answers => {
                        const questionMap = this.getQuestionsMap(survey);
                        answers.forEach(answer => {
                            const qid = answer.questionId;
                            const question = questionMap.get(qid);
                            question.language = answer.language;
                            if (answer.answer) {
                                question.answer = answer.answer;
                            } else if (answer.answers) {
                                question.answers = answer.answers;
                            }
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

    importMetaProperties(record, metaOptions) {
        return metaOptions.reduce((r, propertyInfo) => {
            const name = propertyInfo.name;
            const value = record[name];
            if (value !== undefined && value !== null) {
                r[name] = value;
            }
            return r;
        }, {});
    }

    import (stream, questionIdMap, options = {}) {
        const choicesIdMap = _.values(questionIdMap).reduce((r, { choicesIds }) => {
            Object.assign(r, choicesIds);
            return r;
        }, {});
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
                let skip = 0;
                const map = records.reduce((r, record) => {
                    const id = record.id;
                    let { survey } = r.get(id) || {};
                    if (!survey) {
                        survey = { name: record.name };
                        if (options.meta) {
                            const meta = this.importMetaProperties(record, options.meta);
                            if (Object.keys(meta).length > 0) {
                                survey.meta = meta;
                            }
                        }
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
                    if (record.skipCount) {
                        skip = record.skipCount;
                        question.sections = [{
                            enableWhen: [{
                                questionId: questionIdMap[record.questionId],
                                answer: { choice: choicesIdMap[record.skipValue] },
                                logic: 'not-equals'
                            }],
                            questions: []
                        }];
                        survey.questions.push(question);
                        return r;
                    }
                    if (skip) {
                        const questions = survey.questions;
                        questions[questions.length - 1].sections[0].questions.push(question);
                        skip = skip - 1;
                    } else {
                        survey.questions.push(question);
                    }
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
                    return SPromise.all(pxs)
                        .then(() => {
                            if (options.sourceType) {
                                const type = options.sourceType;
                                const promises = _.transform(mapIds, (r, surveyId, identifier) => {
                                    const record = { type, identifier, surveyId };
                                    const promise = this.surveyIdentifier.createSurveyIdentifier(record, transaction);
                                    r.push(promise);
                                    return r;
                                }, []);
                                return SPromise.all(promises).then(() => mapIds);
                            }
                            return mapIds;
                        });
                });
            });
    }
};
