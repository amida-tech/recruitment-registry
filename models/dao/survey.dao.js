'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const queryrize = require('../../lib/queryrize');
const importUtil = require('../../import/import-util');
const Translatable = require('./translatable');
const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

const sequelize = db.sequelize;
const Survey = db.Survey;
const SurveyQuestion = db.SurveyQuestion;
const SurveySection = db.SurveySection;
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
            ruleParent.answer.choices.forEach((ruleParentChoice) => {
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
            const { id, name, questions, enableWhen } = section;
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
        questions.forEach((question) => {
            const questionIndex = result.questions.length;
            indices.push(questionIndex);
            result.questions.push(question);
            const questionSections = question.sections;
            if (questionSections) {
                questionSections.forEach((section, line) => {
                    const { id, name, sections, questions, enableWhen } = section;
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
            const dbAnswers = this.answer.toDbAnswer(rule.answer);
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
            return SPromise.all(newQuestions.map(q => this.question.createQuestionTx(q.qx, tx)
                        .then(({ id, choices }) => {
                            const inputQuestion = questions[q.index];
                            questions[q.index] = { id, required: inputQuestion.required };
                            questionChoices[id] = choices;
                            let enableWhen = inputQuestion.enableWhen;
                            if (enableWhen) {
                                enableWhen = _.cloneDeep(enableWhen);
                                questions[q.index].enableWhen = enableWhen;
                            }
                        })))
                .then(() => ({ questions, questionChoices }));
        }
        return SPromise.resolve({ questions });
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
                            const code = rule.answer && rule.answer.code;
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
                            const code = rule.answer && rule.answer.code;
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
            parent.enableWhen = enableWhen.map((rule) => {
                const questionIndex = rule.questionIndex;
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
            .then(questions => SPromise.all(questions.map((qx, line) => {
                const record = { questionId: qx.id, surveyId, line, required: Boolean(qx.required) };
                return SurveyQuestion.create(record, { transaction });
            }))
                    .then(() => questions));
    }

    updateSurveyTx(id, survey, transaction) {
        const { sections, questions } = this.flattenHierarchy(survey);
        if (!questions.length) {
            return RRError.reject('surveyNoQuestions');
        }
        return this.createTextTx({ id, name: survey.name, description: survey.description }, transaction)
            .then(({ id }) => this.createSurveyQuestionsTx(questions, sections, id, transaction)
                    .then((questions) => {
                        const questionIds = questions.map(question => question.id);
                        return { questionIds, surveyId: id };
                    }))
            .then(({ questionIds, surveyId }) => {
                if (sections) {
                    return this.surveySection.bulkCreateFlattenedSectionsForSurveyTx(surveyId, questionIds, sections, transaction)
                        .then(sectionIds => this.createRulesForSections(surveyId, sections, sectionIds, transaction))
                        .then(() => surveyId);
                }
                return surveyId;
            })
            .then((surveyId) => {
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
        return sequelize.transaction(transaction => this.createSurveyTx(survey, transaction));
    }

    patchSurveyTextTx({ id, name, description, sections }, language, transaction) {
        return this.createTextTx({ id, name, description, language }, transaction)
            .then(() => {
                if (sections) {
                    return this.surveySection.updateMultipleSectionNamesTx(sections, language, transaction);
                }
                return null;
            });
    }

    patchSurveyText({ id, name, description, sections }, language) {
        return sequelize.transaction(transaction => this.patchSurveyTextTx({ id, name, description, sections }, language, transaction));
    }

    patchSurveyInformationTx(surveyId, { name, description, sections, questions }, transaction) {
        const replacements = {
            text_needed: Boolean(name || (description !== undefined)),
            questions_needed: Boolean(questions || sections),
            sections_needed: Boolean(questions && !sections),
            survey_id: surveyId,
        };
        return sequelize.query(surveyPatchInfoQuery, {
            transaction,
            replacements,
            type: sequelize.QueryTypes.SELECT,
        })
            .then((surveys) => {
                if (!surveys.length) {
                    return RRError.reject('surveyNotFound');
                }
                return surveys[0];
            });
    }

    patchSurveyTx(surveyId, surveyPatch, transaction) {
        return this.patchSurveyInformationTx(surveyId, surveyPatch, transaction)
            .then((survey) => {
                if (!surveyPatch.forceStatus && survey.status === 'retired') {
                    return RRError.reject('surveyRetiredStatusUpdate');
                }
                return SPromise.resolve()
                    .then(() => {
                        const { status, meta, forceStatus } = surveyPatch;
                        if (status || meta) {
                            const fields = {};
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
                        return null;
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
                        return null;
                    })
                    .then(() => {
                        if (!(surveyPatch.questions || surveyPatch.sections)) {
                            return null;
                        }
                        const { sections, questions } = this.flattenHierarchy(surveyPatch);
                        if (!questions) {
                            return RRError.reject('surveyNoQuestionsInSections');
                        }
                        const questionIdSet = new Set();
                        questions.forEach((question) => {
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
                                return null;
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
                                return null;
                            });
                    });
            });
    }

    patchSurvey(id, surveyPatch) {
        return sequelize.transaction(transaction => this.patchSurveyTx(id, surveyPatch, transaction));
    }

    replaceSurveyTx(id, replacement, transaction) {
        return Survey.findById(id)
            .then((survey) => {
                if (!survey) {
                    return RRError.reject('surveyNotFound');
                }
                return survey;
            })
            .then((survey) => {
                const version = survey.version || 1;
                const newSurvey = Object.assign({
                    version: version + 1,
                    groupId: survey.groupId || survey.id,
                }, replacement);
                return this.createSurveyTx(newSurvey, transaction)
                    .then((id) => {
                        if (!survey.version) {
                            return survey.update({ version: 1, groupId: survey.id }, { transaction })
                                .then(() => id);
                        }
                        return id;
                    })
                    .then(id => survey.destroy({ transaction })
                            .then(() => SurveyQuestion.destroy({ where: { surveyId: survey.id }, transaction }))
                            .then(() => ProfileSurvey.destroy({ where: { surveyId: survey.id }, transaction }))
                            .then(() => ProfileSurvey.create({ surveyId: id }, { transaction }))
                            .then(() => id));
            });
    }

    replaceSurvey(id, replacement) {
        return sequelize.transaction(tx => this.replaceSurveyTx(id, replacement, tx));
    }

    createOrReplaceSurvey(input) {
        const survey = _.omit(input, 'parentId');
        const parentId = input.parentId;
        if (parentId) {
            return this.replaceSurvey(parentId, survey);
        }
        return this.createSurvey(survey);
    }

    deleteSurvey(id) {
        return sequelize.transaction(transaction => Survey.destroy({ where: { id }, transaction })
                .then(() => SurveyQuestion.destroy({ where: { surveyId: id }, transaction }))
                .then(() => SurveySection.destroy({ where: { surveyId: id }, transaction }))
                .then(() => ProfileSurvey.destroy({ where: { surveyId: id }, transaction })));
    }

    listSurveys({ scope, status, language, history, order, groupId, version } = {}) {
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
            .then((surveys) => {
                if (scope === 'export') {
                    return this.updateSurveyListExport(surveys);
                }
                return surveys;
            });
    }

    updateSurveyListExport(surveys) {
        const surveyMap = new Map(surveys.map(survey => [survey.id, survey]));
        return SurveyQuestion.findAll({
            raw: true,
            attributes: ['surveyId', 'questionId', 'required'],
            order: 'line',
        })
            .then((surveyQuestions) => {
                surveyQuestions.forEach(({ surveyId, questionId, required }) => {
                    const survey = surveyMap.get(surveyId);
                    const questions = survey.questions;
                    const question = { id: questionId, required };
                    if (questions) {
                        questions.push(question);
                    } else {
                        survey.questions = [question];
                    }
                });
                return surveys;
            })
            .then(() => this.surveySection.updateSurveyListExport(surveyMap))
            .then(() => surveys);
    }

    getSurvey(id, options = {}) {
        let opt = { where: { id }, raw: true, attributes: ['id', 'meta', 'status'] };
        if (options.override) {
            opt = _.assign({}, opt, options.override);
        }
        return Survey.findOne(opt)
            .then((survey) => {
                if (!survey) {
                    return RRError.reject('surveyNotFound');
                }
                if (survey.meta === null) {
                    delete survey.meta;
                }
                if (options.override) {
                    return survey;
                }
                return this.answerRule.getSurveyAnswerRules({ surveyId: survey.id })
                    .then(answerRuleInfos => this.updateText(survey, options.language)
                            .then(() => this.surveyQuestion.listSurveyQuestions(survey.id))
                            .then((surveyQuestions) => {
                                const ids = _.map(surveyQuestions, 'questionId');
                                const language = options.language;
                                return this.question.listQuestions({ scope: 'complete', ids, language })
                                    .then((questions) => {
                                        const qxMap = _.keyBy(questions, 'id');
                                        const qxs = surveyQuestions.map((surveyQuestion) => {
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
                            .then(({ survey, questions }) => this.surveySection.getSectionsForSurveyTx(survey.id, questions, answerRuleInfos, options.language)
                                    .then((result) => {
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
                                    })));
            });
    }

    updateQuestionQuestionsMap(questions, map) {
        questions.forEach((question) => {
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
        sections.forEach((section) => {
            this.updateQuestionsMap(section, map);
        });
        return null;
    }

    getQuestionsMap(survey) {
        const map = new Map();
        this.updateQuestionsMap(survey, map);
        return map;
    }

    updateQuestionQuestionsList(questions, list) {
        questions.forEach((question) => {
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
        sections.forEach((section) => {
            this.updateQuestionsList(section, list);
        });
        return null;
    }

    getQuestions(survey) {
        const list = [];
        this.updateQuestionsList(survey, list);
        return list;
    }

    getAnsweredSurvey(userId, id, options) {
        return this.getSurvey(id, options)
            .then(survey => this.answer.getAnswers({
                userId,
                surveyId: survey.id,
            })
                    .then((answers) => {
                        const questionMap = this.getQuestionsMap(survey);
                        answers.forEach((answer) => {
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
                    }));
    }

    exportAppendQuestionLines(r, startBaseObject, baseObject, questions) {
        questions.forEach(({ id, required, sections }, index) => {
            const line = { questionId: id, required };
            if (index === 0) {
                Object.assign(line, startBaseObject);
            } else {
                Object.assign(line, baseObject);
            }
            r.push(line);
            if (sections) {
                const questionAsParent = Object.assign({ id: baseObject.id, parentQuestionId: id });
                this.exportAppendSectionLines(r, questionAsParent, questionAsParent, sections);
            }
        });
    }

    exportAppendSectionLines(r, startBaseObject, baseObject, parentSections) {
        parentSections.forEach(({ id, sections, questions }, index) => {
            const line = { sectionId: id };
            if (index === 0) {
                Object.assign(line, startBaseObject);
            } else {
                Object.assign(line, baseObject);
            }
            if (questions) {
                const nextLines = Object.assign({ sectionId: id }, baseObject);
                this.exportAppendQuestionLines(r, line, nextLines, questions);
                return;
            }
            r.push(line);
            const sectionAsParent = { id: baseObject.id, parentSectionId: id };
            this.exportAppendSectionLines(r, sectionAsParent, sectionAsParent, sections);
        });
    }

    export() {
        return this.listSurveys({ scope: 'export' })
            .then(surveys => surveys.reduce((r, { id, name, description, questions, sections }) => {
                const surveyLine = { id, name, description };
                if (questions) {
                    this.exportAppendQuestionLines(r, surveyLine, { id }, questions);
                    return r;
                }
                this.exportAppendSectionLines(r, surveyLine, { id }, sections);
                return r;
            }, []))
            .then((lines) => {
                const converter = new ExportCSVConverter({ fields: ['id', 'name', 'description', 'parentSectionId', 'parentQuestionId', 'sectionId', 'questionId', 'required'] });
                return converter.dataToCSV(lines);
            });
    }

    importToDb(surveys, surveyQuestions, surveySections, surveySectionQuestions, options = {}) {
        return sequelize.transaction((transaction) => {
            const idMap = {};
            const promises = surveys.map((survey) => {
                const { id: importId, name, description, meta } = survey;
                const record = meta ? { meta } : {};
                const fields = _.omit(record, ['name', 'description', 'id']);
                return Survey.create(fields, { transaction })
                    .then(({ id }) => this.createTextTx({ id, name, description }, transaction))
                    .then(({ id }) => { idMap[importId] = id; });
            });
            return SPromise.all(promises).then(() => idMap)
                .then((idMap) => {
                    surveyQuestions.forEach((surveyQuestion) => {
                        const newSurveyId = idMap[surveyQuestion.surveyId];
                        Object.assign(surveyQuestion, { surveyId: newSurveyId });
                    });
                    return this.surveyQuestion.importSurveyQuestionsTx(surveyQuestions, transaction)
                        .then(() => idMap);
                })
                .then((idMap) => {
                    surveySections.forEach((surveySection) => {
                        const newSurveyId = idMap[surveySection.surveyId];
                        Object.assign(surveySection, { surveyId: newSurveyId });
                    });
                    return this.surveySection.importSurveySectionsTx(surveySections, surveySectionQuestions, transaction)
                        .then(() => idMap);
                })
                .then((idMap) => {
                    if (options.sourceType) {
                        const type = options.sourceType;
                        const promises = _.transform(idMap, (r, surveyId, identifier) => {
                            const record = { type, identifier, surveyId };
                            const promise = this.surveyIdentifier.createSurveyIdentifier(record, transaction);
                            r.push(promise);
                            return r;
                        }, []);
                        return SPromise.all(promises).then(() => idMap);
                    }
                    return idMap;
                });
        });
    }

    import(stream, { questionIdMap, sectionIdMap }, options = {}) {
        questionIdMap = _.toPairs(questionIdMap).reduce((r, pair) => {
            r[pair[0]] = pair[1].questionId;
            return r;
        }, {});
        const converter = new ImportCSVConverter({ checkType: false });
        return converter.streamToRecords(stream)
            .then(records => records.map((record) => {
                const idFields = ['sectionId', 'questionId', 'parentSectionId', 'parentQuestionId'];
                const newRecord = _.omit(record, idFields);
                ['sectionId', 'parentSectionId'].forEach((field) => {
                    const value = record[field];
                    if (value) {
                        const newValue = sectionIdMap[value];
                        if (!newValue) {
                            throw new RRError('surveyImportMissingSectionId', value);
                        }
                        newRecord[field] = newValue;
                    }
                });
                ['questionId', 'parentQuestionId'].forEach((field) => {
                    const value = record[field];
                    if (value) {
                        const newValue = questionIdMap[value];
                        if (!newValue) {
                            throw new RRError('surveyImportMissingQuestionId', value);
                        }
                        newRecord[field] = newValue;
                    }
                });
                return newRecord;
            }))
            .then((records) => {
                if (!records.length) {
                    return {};
                }
                let currentId = null;
                const sectionMap = new Map();
                const surveys = [];
                const surveyQuestions = [];
                const surveySections = [];
                const surveySectionQuestions = [];
                records.forEach((record) => {
                    const id = record.id;
                    if (id !== currentId) {
                        const survey = { id, name: record.name };
                        importUtil.updateMeta(survey, record, options);
                        if (record.description) {
                            survey.description = record.description;
                        }
                        surveys.push(survey);
                        currentId = id;
                    }
                    if (record.sectionId) {
                        let index = sectionMap.get(record.sectionId);
                        if (index === undefined) {
                            index = surveySections.length;
                            const section = { surveyId: id, sectionId: record.sectionId, line: index };
                            surveySections.push(section);
                            sectionMap.set(record.sectionId, index);
                            const { parentSectionId, parentQuestionId } = record;
                            if (parentSectionId) {
                                const parentIndex = sectionMap.get(parentSectionId);
                                if (parentIndex === undefined) {
                                    throw new RRError('surveyImportMissingParentSectionId', parentSectionId);
                                }
                                section.parentIndex = parentIndex;
                            }
                            if (parentQuestionId) {
                                section.parentQuestionId = parentQuestionId;
                            }
                        }
                        if (record.questionId) {
                            surveySectionQuestions.push({
                                sectionIndex: index,
                                questionId: record.questionId,
                                line: surveySectionQuestions.length,
                            });
                        }
                    }
                    if (record.questionId) {
                        const question = {
                            surveyId: id,
                            questionId: record.questionId,
                            required: record.required,
                            line: surveyQuestions.length,
                        };
                        surveyQuestions.push(question);
                    }
                });
                return this.importToDb(surveys, surveyQuestions, surveySections, surveySectionQuestions, options);
            });
    }
};
