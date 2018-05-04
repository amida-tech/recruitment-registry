'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');

const answerCommon = require('./answer-common');
const constNames = require('../const-names');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const queryrize = require('../../lib/queryrize');
const dbUtil = require('../../lib/db-util');
const importUtil = require('../../import/import-util');
const zipUtil = require('../../lib/zip-util');
const Translatable = require('./translatable');
const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

const Op = Sequelize.Op;

const surveyPatchInfoQuery = queryrize.readQuerySync('survey-patch-info.sql');
const missingChoicesQuery = queryrize.readQuerySync('missing-choices.sql');

const translateRuleChoices = function (ruleParent, choices) {
    const choiceText = _.get(ruleParent, 'answer.choiceText');
    let rawChoices = _.get(ruleParent, 'answer.choices');
    const code = _.get(ruleParent, 'answer.code');
    if (rawChoices) {
        rawChoices = rawChoices.filter(choice => choice.text);
        if (!rawChoices.length) {
            rawChoices = null;
        }
    }
    if (choiceText || rawChoices || code) {
        if (!choices) {
            throw new RRError('surveyRuleChoiceForNonChoice');
        }
        const p = ruleParent.answer;
        if (choiceText) {
            const serverChoice = choices.find(choice => choice.text === choiceText);
            if (!serverChoice) {
                throw new RRError('surveyRuleChoiceTextNotFound', choiceText);
            }
            const choice = serverChoice.id;
            if (choice) {
                p.choice = choice;
                delete p.choiceText;
            }
        }
        if (rawChoices) {
            p.choices.forEach((r) => {
                const serverChoice = choices.find(choice => choice.text === r.text);
                if (!serverChoice) {
                    throw new RRError('surveyRuleChoiceNotFound', r.text);
                }
                const id = serverChoice.id;
                if (id) {
                    r.id = id;
                    delete r.text;
                    if (Object.keys(r).length === 1) {
                        r.boolValue = true;
                    }
                }
            });
        }
        if (code) {
            const serverChoice = choices.find(choice => choice.code === code);
            if (!serverChoice) {
                throw new RRError('questionChoiceCodeNotFound', code);
            }
            if (serverChoice) {
                const choice = serverChoice.id;
                if (choice) {
                    p.choice = choice;
                    delete p.code;
                }
            }
        }
        return ruleParent;
    }
    return null;
};

const translateEnableWhenOnly = function (enableWhen, questions, questionChoices) {
    return enableWhen.map((r) => {
        if (questionChoices) {
            const choices = questionChoices[r.questionId];
            return translateRuleChoices(r, choices) || r;
        }
        return r;
    });
};

const translateEnableWhen = function (parent, questions, questionChoices) {
    let enableWhen = parent.enableWhen;
    if (enableWhen) {
        enableWhen = _.cloneDeep(enableWhen);
        parent.enableWhen = translateEnableWhenOnly(enableWhen, questions, questionChoices); // eslint-disable-line no-param-reassign, max-len
    }
    return parent;
};

const findPatchedQuestionPropers = function (matchedQuestions, force) {
    const result = matchedQuestions.reduce((r, { object, patch }) => {
        const questionProper = _.omit(object, ['required', 'enableWhen']);
        const questionPatchProper = _.omit(patch, ['required', 'enableWhen']);
        if (!_.isEqual(questionProper, questionPatchProper)) {
            questionPatchProper.force = force;
            r.push({ patch: questionPatchProper, object: questionProper });
        }
        return r;
    }, []);
    return result;
};

const createQuestionChoicesMap = function (questions, newChoices) {
    const result = questions.reduce((r, question) => {
        const id = question.id;
        if (id) {
            const choices = question.choices;
            if (choices) {
                r[id] = choices.filter(ch => ch.id);
            }
        }
        return r;
    }, {});
    if (newChoices) {
        newChoices.forEach((choice) => {
            const questionId = choice.questionId;
            let choices = result[questionId];
            if (!choices) {
                choices = {};
                result[questionId] = choices;
            }
            choices.push(choice);
        });
    }
    return result;
};

const formSurveyQuestionsPatch = function (input) {
    const { questionsPatch, questions } = input;
    const questionsMap = questions.reduce((r, question) => {
        r[question.id] = question;
        return r;
    }, {});
    const surveyQuestionsPatch = questionsPatch.map((questionPatch) => {
        const id = questionPatch.id;
        if (!id) {
            return questionPatch;
        }
        const question = questionsMap[id];
        const required = questionPatch.required || false;
        if (!question) {
            const result = { id, required };
            if (questionPatch.enableWhen) {
                result.enableWhen = questionPatch.enableWhen;
            }
            return result;
        }
        const result = { id, required };
        let enableWhenPatch = questionPatch.enableWhen;
        if (!enableWhenPatch) {
            if (question.enableWhen) {
                result.enableWhen = [];
            }
            return result;
        }
        enableWhenPatch = enableWhenPatch.map(ewp => _.omit(ewp, 'id'));
        let enableWhen = question.enableWhen;
        if (!enableWhen) {
            result.enableWhen = enableWhenPatch;
            return result;
        }
        enableWhen = enableWhen.map(ewp => _.omit(ewp, 'id'));
        if (_.isEqual(enableWhen, enableWhenPatch)) {
            return result;
        }
        result.enableWhen = enableWhenPatch;
        return result;
    }, []);
    return surveyQuestionsPatch;
};

const formSurveySectionEnableWhenPatch = function (sections, sectionsPatch) {
    if (!sections) {
        return sectionsPatch;
    }
    const sectionsMap = dbUtil.makeMapById(sections);
    const result = sectionsPatch.map((sectionPatch) => {
        const id = sectionPatch.id;
        if (!id) {
            return sectionPatch;
        }
        const section = sectionsMap[id];
        if (!section) {
            return sectionPatch;
        }
        let enableWhenPatch = sectionPatch.enableWhen;
        if (!enableWhenPatch) {
            if (section.enableWhen) {
                return Object.assign({ enableWhen: [] }, sectionPatch);
            }
            return sectionPatch;
        }
        enableWhenPatch = enableWhenPatch.map(ewp => _.omit(ewp, 'id'));
        let enableWhen = section.enableWhen;
        if (!enableWhen) {
            return sectionPatch;
        }
        enableWhen = enableWhen.map(ewp => _.omit(ewp, 'id'));
        if (_.isEqual(enableWhen, enableWhenPatch)) {
            return _.omit(sectionPatch, 'enableWhen');
        }
        return sectionPatch;
    });
    return result;
};

const resolveEnableWhensQuestionIndex = function (parents, idedQuestions) {
    return parents.map((parent) => {
        const enableWhen = parent.enableWhen;
        if (!enableWhen) {
            return parent;
        }
        const newEnableWhen = enableWhen.map((rule) => {
            const questionIndex = rule.questionIndex;
            if (questionIndex === undefined) {
                return rule;
            }
            const question = idedQuestions[questionIndex];
            if (!question) {
                throw new RRError('surveyRuleQuestionIndexNotFound', questionIndex);
            }
            const questionId = question.id;
            return Object.assign({ questionId }, _.omit(rule, 'questionIndex'));
        });
        return Object.assign({}, parent, { enableWhen: newEnableWhen });
    });
};

const findEnableWhenMissingChoices = function (parents, questionChoices, existing) {
    return parents.reduce((r, parent) => {
        const enableWhen = parent.enableWhen;
        if (!enableWhen) {
            return r;
        }
        enableWhen.forEach((rule) => {
            const answer = rule.answer;
            if (!answer) {
                return;
            }
            const { choiceText, code } = answer;
            let choices = answer.choices;
            if (choices) {
                choices = choices.filter(choice => choice.text);
                if (!choices.length) {
                    choices = null;
                }
            }
            if (!(choiceText || choices || code)) {
                return;
            }
            const questionId = rule.questionId;
            if (questionChoices[questionId]) {
                return;
            }
            r.questionIds.add(questionId);
            if (choiceText) {
                r.texts.add(`'${choiceText}'`);
            }
            if (choices) {
                choices.forEach((choice) => {
                    if (choice.text) {
                        r.texts.add(`'${choice.text}'`);
                    }
                });
            }
            if (code) {
                r.codes.add(`'${code}'`);
            }
        });
        return r;
    }, existing || {
        texts: new Set(), codes: new Set(), questionIds: new Set(),
    });
};

module.exports = class SurveyDAO extends Translatable {
    constructor(db, dependencies) {
        super(db, 'SurveyText', 'surveyId', ['name', 'description'], { description: true });
        Object.assign(this, dependencies);
        this.db = db;
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
                const index = result.sections.length ? result.sections.length - 1 : null;
                this.flattenSectionsHieararchy(section.sections, result, index);
            }
        });
        return result;
    }

    flattenQuestionsHierarchy(parentQuestions, result) {
        const indices = [];
        parentQuestions.forEach((question) => {
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
                        const indices2 = this.flattenQuestionsHierarchy(questions, result);
                        sectionInfo.indices = indices2;
                    }
                    if (sections) {
                        const n = result.sections.length;
                        const parentIndex = n ? n - 1 : null;
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

    createRuleAnswerValue(ruleId, ruleAnswer, transaction) {
        const AnswerRuleValue = this.db.AnswerRuleValue;
        if (!(ruleId && ruleAnswer)) {
            return null;
        }
        if (ruleAnswer) {
            const dbAnswers = answerCommon.prepareAnswerForDB(ruleAnswer);
            const pxs = dbAnswers.map(({ questionChoiceId, value }) => {
                const record = {
                    ruleId,
                    questionChoiceId: questionChoiceId || null,
                    value: (value !== undefined ? value : null),
                    meta: ruleAnswer.meta,
                };
                return AnswerRuleValue
                    .create(!ruleAnswer.meta ? _.omit(record, 'meta') : record, { transaction });
            });
            return SPromise.all(pxs);
        }
        return null;
    }

    createNewQuestionsTx(questions, tx) {
        const pxs = questions.map((question) => {
            if (question.id) {
                return SPromise.resolve(question);
            }
            return this.question.createQuestionTx(question, tx)
                .then(({ id, choices }) => Object.assign({ id }, question, { choices }));
        });
        return SPromise.all(pxs);
    }

    createNewSectionsTx(sections, tx) {
        const pxs = sections.map((section) => {
            if (section.id) {
                return SPromise.resolve(section);
            }
            return this.section.createSectionTx(section, tx)
                .then(({ id }) => Object.assign({ id }, section));
        });
        return SPromise.all(pxs);
    }

    createRulesForEnableWhen(baseObject, enableWhen, transaction) {
        return this.db.AnswerRule.destroy({ where: baseObject, transaction })
            .then(() => {
                const promises = enableWhen.map((p, line) => {
                    const answerRule = Object.assign({
                        logic: p.logic,
                        line,
                        answerQuestionId: p.questionId,
                        answerSurveyId: p.surveyId || null,
                    }, baseObject);
                    return this.db.AnswerRule.create(answerRule, { transaction })
                        .then(({ id }) => this.createRuleAnswerValue(id, p.answer, transaction));
                });
                return SPromise.all(promises);
            });
    }

    createRulesForQuestions(surveyId, questions, transaction) {
        const questionsWithRule = questions.filter(question => question.enableWhen);
        if (questionsWithRule.length) {
            const promises = questionsWithRule.reduce((r, question) => {
                const baseObject = { surveyId, questionId: question.id };
                const enableWhen = question.enableWhen;
                const px = this.createRulesForEnableWhen(baseObject, enableWhen, transaction);
                r.push(px);
                return r;
            }, []);
            return SPromise.all(promises).then(() => questions);
        }
        return SPromise.resolve(questions);
    }

    createRulesForSections(surveyId, sections, sectionIds, transaction) {
        const n = sections.length;
        const sectionsWithRule = _.range(n).filter(index => sections[index].enableWhen);
        if (sectionsWithRule.length) {
            const promises = sectionsWithRule.reduce((r, index) => {
                const section = sections[index];
                const sectionId = sectionIds[index];
                const baseObject = { surveyId, sectionId };
                const enableWhen = section.enableWhen;
                const px = this.createRulesForEnableWhen(baseObject, enableWhen, transaction);
                r.push(px);
                return r;
            }, []);
            return SPromise.all(promises).then(() => sections);
        }
        return SPromise.resolve(sections);
    }

    createSurveyEnableWhen(surveyId, enableWhen, transaction) {
        const baseObject = { surveyId, sectionId: null, questionId: null };
        const enableWhenWithZipRangeValue = _.cloneDeep(enableWhen);
        const promises = enableWhenWithZipRangeValue.reduce((r, condition) => {
            if (condition.answer && condition.answer.meta && condition.answer.meta.zipRangeValue) {
                const px = zipUtil.findVicinity(condition.answer.textValue,
                    condition.answer.meta.zipRangeValue)
                    .then(zipList => Object.assign(condition, {
                        answer: {
                            meta: {
                                zipRangeValue: condition.answer.meta.zipRangeValue,
                                inRangeValue: zipList,
                            },
                            textValue: condition.answer.textValue,
                        },
                    }));
                r.push(px);
            }
            return r;
        }, []);
        return SPromise.all(promises).then(() => this.createRulesForEnableWhen(baseObject,
            enableWhenWithZipRangeValue, transaction));
    }

    createRulesForSurvey(id, survey, transaction) {
        const enableWhen = survey.enableWhen;
        if (enableWhen) {
            return this.createSurveyEnableWhen(id, enableWhen, transaction).then(() => ({ id }));
        }
        return ({ id });
    }

    createEnableWhensTx({ surveyId, questions, sections }, transaction) {
        return this.createRulesForQuestions(surveyId, questions, transaction)
            .then(() => {
                if (sections) {
                    const sectionIds = sections.map(({ id }) => id);
                    return this.createRulesForSections(surveyId, sections, sectionIds, transaction); // eslint-disable-line max-len
                }
                return null;
            });
    }

    createSurveyQuestionsTx(surveyId, questions, tx) {
        const sq = this.surveyQuestion;
        return this.createNewQuestionsTx(questions, tx)
            .then(idedQuestions => sq.createSurveyQuestionsTx({ surveyId, questions: idedQuestions }, tx) // eslint-disable-line max-len
                .then(() => idedQuestions));
    }

    createSurveySectionsTx(surveyId, sections, questionIds, tx) {
        const ss = this.surveySection;
        return this.createNewSectionsTx(sections, tx)
            .then(idedSections => ss.createIndexedSurveySectionsTx(surveyId, questionIds, idedSections, tx) // eslint-disable-line max-len
                .then(() => idedSections));
    }

    resolveEnableWhensTx({ idedQuestions, idedSections, questionChoices }, transaction) {
        let sections;
        const questions = resolveEnableWhensQuestionIndex(idedQuestions, idedQuestions);
        let missingChoices = findEnableWhenMissingChoices(questions, questionChoices);
        if (idedSections) {
            sections = resolveEnableWhensQuestionIndex(idedSections, idedQuestions);
            missingChoices = findEnableWhenMissingChoices(sections, questionChoices, missingChoices); // eslint-disable-line max-len
        }
        const result = {
            idedQuestions: questions,
            idedSections: sections,
            questionChoices,
        };
        if (!missingChoices.questionIds.size) {
            questions.forEach(r => translateEnableWhen(r, questions, questionChoices));
            if (sections) {
                sections.forEach(r => translateEnableWhen(r, questions, questionChoices));
            }
            return SPromise.resolve(result);
        }
        const questionIds = Array.from(missingChoices.questionIds);
        const replacements = { ids: `(${questionIds.join(', ')})` };
        const texts = Array.from(missingChoices.texts);
        const codes = Array.from(missingChoices.codes);
        let query = queryrize.replaceParameters(missingChoicesQuery, replacements);
        let addlQuery = '';
        if (codes.length) {
            addlQuery = `qc.code IN (${codes.join(', ')})`;
        }
        if (texts.length) {
            addlQuery += addlQuery ? ` OR ${addlQuery} ` : '';
            addlQuery = `qct.text IN (${texts.join(', ')})`;
        }
        query += ` AND (${addlQuery})`;
        return this.selectQuery(query, {}, transaction)
            .then((rows) => {
                Object.assign(questionChoices, _.groupBy(rows, 'questionId'));
                questions.forEach(r => translateEnableWhen(r, questions, questionChoices));
                if (sections) {
                    sections.forEach(r => translateEnableWhen(r, questions, questionChoices));
                }
                return result;
            });
    }

    createSurveyArraysTx({ surveyId, questions, sections, questionChoices }, transaction) {
        return this.createSurveyQuestionsTx(surveyId, questions, transaction)
            .then((idedQuestions) => {
                const qchs = idedQuestions.reduce((r, question) => {
                    const choices = question.choices;
                    if (choices) {
                        r[question.id] = choices;
                    }
                    return r;
                }, {});
                if (questionChoices) {
                    Object.assign(qchs, questionChoices);
                }
                if (!sections) {
                    const payload = { idedQuestions, questionChoices: qchs };
                    return this.resolveEnableWhensTx(payload, transaction);
                }
                const questionIds = idedQuestions.map(({ id }) => id);
                return this.createSurveySectionsTx(surveyId, sections, questionIds, transaction)
                    .then((idedSections) => {
                        const payload = { idedSections, idedQuestions, questionChoices: qchs };
                        return this.resolveEnableWhensTx(payload, transaction);
                    });
            });
    }

    updateSurveyTx(id, survey, transaction) {
        const { sections, questions } = this.flattenHierarchy(survey);
        if (!questions.length) {
            return RRError.reject('surveyNoQuestions');
        }
        const record = { id, name: survey.name, description: survey.description };
        return this.createTextTx(record, transaction)
            .then(() => this.createRulesForSurvey(id, survey, transaction))
            .then(() => {
                const payload = { surveyId: id, questions, sections };
                return this.createSurveyArraysTx(payload, transaction);
            })
            .then(({ idedQuestions, idedSections }) => {
                const payload = {
                    surveyId: id,
                    questions: idedQuestions,
                    sections: idedSections,
                };
                return this.createEnableWhensTx(payload, transaction);
            })
            .then(() => {
                if (survey.identifier) {
                    const { type, value: identifier } = survey.identifier;
                    return this.surveyIdentifier.createSurveyIdentifier({ type, identifier, surveyId: id }, transaction) // eslint-disable-line max-len
                        .then(() => id);
                }
                return id;
            });
    }

    createSurveyTx(survey, userId, transaction) {
        const fields = _.omit(survey, [
            'name', 'description', 'sections', 'questions', 'identifier', 'enableWhen',
        ]);
        fields.authorId = userId;
        return this.db.Survey.create(fields, { transaction })
            .then(({ id }) => this.updateSurveyTx(id, survey, transaction));
    }

    createSurvey(survey, userId = 1) {
        return this.transaction(transaction => this.createSurveyTx(survey, userId, transaction));
    }

    patchSurveyTextTx({ id, name, description, sections }, language, transaction) {
        return this.createTextTx({ id, name, description, language }, transaction)
            .then(() => {
                if (sections) {
                    return this.surveySection.updateMultipleSectionNamesTx(sections, language, transaction); // eslint-disable-line max-len
                }
                return null;
            });
    }

    patchSurveyText({ id, name, description, sections }, language) {
        return this.transaction(transaction => this.patchSurveyTextTx({ id, name, description, sections }, language, transaction)); // eslint-disable-line max-len
    }

    patchSurveyInformationTx(surveyId, { name, description, sections, questions }, transaction) {
        const replacements = {
            text_needed: Boolean(name || (description !== undefined)),
            questions_needed: Boolean(questions || sections),
            sections_needed: Boolean(questions && !sections),
            survey_id: surveyId,
        };
        return this.selectQuery(surveyPatchInfoQuery, replacements, transaction)
            .then((surveys) => {
                if (!surveys.length) {
                    return RRError.reject('surveyNotFound');
                }
                return surveys[0];
            });
    }

    validatePatchSurveyFields(id, fields, transaction) {
        const type = fields.type;
        if (!type) {
            return SPromise.resolve();
        }
        const property = type === constNames.feedbackSurveyType ? 'surveyId' : 'feedbackSurveyId';
        const where = { [property]: id };
        return this.db.FeedbackSurvey.count({ where, transaction })
            .then((count) => {
                if (count > 0) {
                    return RRError.reject('surveyNoPatchTypeWhenFeedback');
                }
                return this.db.Answer.count({ where: { surveyId: id }, transaction });
            })
            .then((count) => {
                if (count > 0) {
                    return RRError.reject('surveyNoPatchTypeWhenAnswer');
                }
                return null;
            });
    }

    // use empty object to remove meta
    patchSurveyFieldsTx(survey, { status, meta, type, forceStatus }, transaction) {
        if (status || meta || type) {
            const fields = {};
            const { status: currentStatus, id } = survey;
            if (status && (status !== currentStatus)) {
                if (currentStatus === 'draft' && status === 'retired') {
                    return RRError.reject('surveyDraftToRetiredUpdate');
                }
                if (!forceStatus && (status === 'draft') && (currentStatus === 'published')) {
                    return RRError.reject('surveyPublishedToDraftUpdate');
                }
                fields.status = status;
            }
            if (type && (type !== survey.type)) {
                fields.type = type;
            }
            if (meta) {
                if (_.isEmpty(meta)) {
                    fields.meta = null;
                } else {
                    fields.meta = meta;
                }
            }
            if (!_.isEmpty(fields)) {
                const where = { id };
                return this.validatePatchSurveyFields(id, fields, transaction)
                    .then(() => this.db.Survey.update(fields, { where, transaction }));
            }
        }
        return SPromise.resolve();
    }

    removeSurveyQuestions(surveyId, questionIds, transaction) {
        if (questionIds.length) {
            const where = {
                surveyId, questionId: { [Op.in]: questionIds },
            };
            return this.db.AnswerRule.destroy({ where, transaction })
                .then(() => this.db.Answer.destroy({ where, transaction }));
        }
        return SPromise.resolve();
    }

    patchSurveyTx(surveyId, surveyPatch, transaction) {
        return this.patchSurveyInformationTx(surveyId, surveyPatch, transaction)
            .then((survey) => {
                Object.assign(survey, { id: surveyId });
                if (!surveyPatch.forceStatus && survey.status === 'retired') {
                    return RRError.reject('surveyRetiredStatusUpdate');
                }
                return this.patchSurveyFieldsTx(survey, surveyPatch, transaction)
                    .then(() => {
                        let { name, description } = surveyPatch;
                        if (name || (description !== undefined)) {
                            name = name || survey.name;
                            if (description === '') {
                                description = null;
                            } else {
                                description = description || survey.description;
                            }
                            const record = { id: surveyId, name, description };
                            return this.createTextTx(record, transaction);
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
                        if (removedQuestionIds.length || (survey.questionIds.length !== questions.length)) { // eslint-disable-line max-len
                            if (!surveyPatch.forceQuestions && (surveyPatch.status !== 'draft')) {
                                return RRError.reject('surveyChangeQuestionWhenPublished');
                            }
                        }
                        return this.db.SurveyQuestion.destroy({ where: { surveyId }, transaction })
                            .then(() => this.removeSurveyQuestions(surveyId, removedQuestionIds, transaction)) // eslint-disable-line max-len
                            .then(() => {
                                const payload = { surveyId, questions, sections };
                                return this.createSurveyArraysTx(payload, transaction);
                            })
                            .then(({ idedQuestions, idedSections }) => {
                                const payload = {
                                    surveyId,
                                    questions: idedQuestions,
                                    sections: idedSections,
                                };
                                return this.createEnableWhensTx(payload, transaction);
                            })
                            .then(() => {
                                if (!sections && survey.sectionCount) {
                                    return this.surveySection.deleteSurveySectionsTx(surveyId, transaction); // eslint-disable-line max-len
                                }
                                return null;
                            });
                    });
            });
    }

    patchSurveyQuestions(survey, surveyPatch, transaction) {
        const language = surveyPatch.language || 'en';

        const {
            sections: sectionsPatch,
            questions: questionsPatch,
        } = this.flattenHierarchy(surveyPatch);

        if (!questionsPatch) {
            return RRError.reject('surveyNoQuestions');
        }

        const { questions, sections } = this.flattenHierarchy(survey);

        const {
            removed: removedQuestionIds,
            matches: matchedQuestions,
        } = dbUtil.compareToPatches(questions, questionsPatch);

        const forceQxs = surveyPatch.forceQuestions;
        const patchedQuestionPropers = findPatchedQuestionPropers(matchedQuestions, forceQxs);

        const {
            // removed: removedSectionIds,
            matches: matchedSections,
        } = dbUtil.compareToPatches(sections || [], sectionsPatch || []);

        return this.section.patchSectionPairsTx(matchedSections, language, transaction)
            .then(() => this.question.patchQuestionPairsTx(patchedQuestionPropers, language, transaction)) // eslint-disable-line max-len
            .then(({ newChoices } = {}) => {
                if (removedQuestionIds.length) {
                    if (!surveyPatch.forceQuestions && (surveyPatch.status !== 'draft')) {
                        return RRError.reject('surveyChangeQuestionWhenPublished');
                    }
                }
                const surveyId = survey.id;
                return this.db.SurveyQuestion.destroy({ where: { surveyId }, transaction })
                    .then(() => this.removeSurveyQuestions(surveyId, removedQuestionIds, transaction)) // eslint-disable-line max-len
                    .then(() => {
                        const questionChoices = createQuestionChoicesMap(questionsPatch, newChoices); // eslint-disable-line max-len
                        const payload = {
                            surveyId,
                            questions: questionsPatch,
                            sections: sectionsPatch,
                            questionChoices,
                        };
                        return this.createSurveyArraysTx(payload, transaction);
                    })
                    .then(({ idedQuestions, idedSections }) => {
                        const payload = {
                            surveyId,
                            questions: formSurveyQuestionsPatch({ questionsPatch: idedQuestions, questions }), // eslint-disable-line max-len
                            sections: formSurveySectionEnableWhenPatch(sections, idedSections),
                        };
                        return this.createEnableWhensTx(payload, transaction);
                    })
                    .then(() => {
                        if (!sectionsPatch && sections) {
                            return this.surveySection.deleteSurveySectionsTx(surveyId, transaction);
                        }
                        return null;
                    });
            });
    }

    patchSurveyCompleteTx(surveyId, surveyPatch, transaction) {
        const language = surveyPatch.language || 'en';
        // TODO: Need a version of getSurvey with transaction
        return this.getSurvey(surveyId)
            .then((survey) => {
                if (!surveyPatch.forceStatus && survey.status === 'retired') {
                    return RRError.reject('surveyRetiredStatusUpdate');
                }
                const { status, type, meta, forceStatus } = surveyPatch;
                const surveyFieldsPatch = { status, type, forceStatus };
                surveyFieldsPatch.meta = !meta ? {} : meta;
                return this.patchSurveyFieldsTx(survey, surveyFieldsPatch, transaction)
                    .then(() => {
                        const { name, description } = surveyPatch;
                        const { name: existingName, description: existingDescription } = survey;
                        if ((name !== existingName) || (description !== existingDescription)) {
                            const record = { id: surveyId, name, language };
                            record.description = description || null;
                            return this.createTextTx(record, transaction);
                        }
                        return null;
                    })
                    .then(() => {
                        const enableWhen = survey.enableWhen;
                        const enableWhenPatch = surveyPatch.enableWhen;
                        if (!enableWhen && !enableWhenPatch) {
                            return null;
                        }
                        if (enableWhen && enableWhenPatch) {
                            const enableWhenNoId = _.omit(enableWhen, 'id');
                            const enableWhenPatchNoId = _.omit(enableWhenPatch, 'id');
                            if (_.isEqual(enableWhenNoId, enableWhenPatchNoId)) {
                                return null;
                            }
                        }
                        const patch = enableWhenPatch || [];
                        return this.createSurveyEnableWhen(surveyId, patch, transaction);
                    })
                    .then(() => this.patchSurveyQuestions(survey, surveyPatch, transaction));
            });
    }

    patchSurvey(id, surveyPatch) {
        return this.transaction((transaction) => {
            if (surveyPatch.complete) {
                return this.patchSurveyCompleteTx(id, surveyPatch, transaction);
            }
            return this.patchSurveyTx(id, surveyPatch, transaction);
        });
    }

    replaceSurveyTx(originalId, replacement, userId, transaction) {
        return this.db.Survey.findById(originalId)
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
                return this.createSurveyTx(newSurvey, userId, transaction)
                    .then((id) => {
                        if (!survey.version) {
                            const record = { version: 1, groupId: survey.id };
                            return survey.update(record, { transaction })
                                .then(() => id);
                        }
                        return id;
                    })
                    .then((id) => {
                        const where = { surveyId: survey.id };
                        const record = { surveyId: id };
                        return survey.destroy({ transaction })
                            .then(() => this.db.SurveyQuestion.destroy({ where, transaction }))
                            .then(() => this.db.ProfileSurvey.destroy({ where, transaction }))
                            .then(() => this.db.ProfileSurvey.create(record, { transaction }))
                            .then(() => id);
                    });
            });
    }

    replaceSurvey(id, replacement, userId = 1) {
        return this.transaction(tx => this.replaceSurveyTx(id, replacement, userId, tx));
    }

    createOrReplaceSurvey(surveyInfo, userId = 1) {
        const newSurvey = _.omit(surveyInfo, 'parentId');
        const parentId = surveyInfo.parentId;
        if (parentId) {
            return this.replaceSurvey(parentId, newSurvey, userId);
        }
        return this.createSurvey(newSurvey, userId);
    }

    deleteSurvey(id) {
        const Survey = this.db.Survey;
        const SurveyQuestion = this.db.SurveyQuestion;
        const SurveySection = this.db.SurveySection;
        const ProfileSurvey = this.db.ProfileSurvey;
        const SurveyConsent = this.db.SurveyConsent;
        const Answer = this.db.Answer;
        return this.transaction(transaction => Survey.destroy({ where: { id }, transaction })
                .then(() => SurveyQuestion.destroy({ where: { surveyId: id }, transaction }))
                .then(() => SurveySection.destroy({ where: { surveyId: id }, transaction }))
                .then(() => ProfileSurvey.destroy({ where: { surveyId: id }, transaction }))
                .then(() => Answer.destroy({ where: { surveyId: id }, transaction }))
                .then(() => SurveyConsent.destroy({ where: { surveyId: id }, transaction })));
    }

    listSurveys(opt = {}) {
        const { scope, language, history, order, groupId, version, ids, type } = opt;
        const status = opt.status || 'published';
        const attributes = (status === 'all') ? ['id', 'status'] : ['id'];
        if (!type) {
            attributes.push('type');
        }
        if (scope === 'version-only' || scope === 'version') {
            attributes.push('groupId');
            attributes.push('version');
        }
        if (opt.admin && scope !== 'export') {
            attributes.push('authorId');
        }
        const options = { raw: true, attributes, order: order || ['id'], paranoid: !history };
        if (groupId || version || (status !== 'all') || ids || type) {
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
            if (ids) {
                options.where.id = { [Op.in]: ids };
            }
            if (type) {
                options.where.type = type;
            }
        }
        if (language) {
            options.language = language;
        }
        if (scope === 'version-only') {
            return this.db.Survey.findAll(options);
        }
        if (scope === 'id-only') {
            return this.db.Survey.findAll(options)
                .then(surveys => surveys.map(survey => survey.id));
        }
        return this.db.Survey.findAll(options)
            .then(surveys => this.updateAllTexts(surveys, options.language))
            .then((surveys) => {
                if (scope === 'export') {
                    return this.updateSurveyListExport(surveys);
                }
                if (!opt.admin) {
                    return surveys;
                }
                const surveyIds = surveys.map(({ id }) => id);
                return this.db.SurveyConsent.findAll({
                    where: { surveyId: { [Op.in]: surveyIds } },
                    raw: true,
                    attributes: ['surveyId', 'consentTypeId'],
                    order: ['consent_type_id'],
                })
                    .then(records => records.reduce((r, record) => {
                        const id = record.surveyId;
                        const current = r.get(id);
                        if (!current) {
                            r.set(id, [record.consentTypeId]);
                            return r;
                        }
                        current.push(record.consentTypeId);
                        return r;
                    }, new Map()))
                    .then((map) => {
                        surveys.forEach((r) => {
                            const id = r.id;
                            const consentTypeIds = map.get(id);
                            if (consentTypeIds) {
                                r.consentTypeIds = _.uniq(consentTypeIds);
                            }
                        });
                        return surveys;
                    });
            });
    }

    updateSurveyListExport(surveys) {
        const surveyMap = new Map(surveys.map(survey => [survey.id, survey]));
        return this.db.SurveyQuestion.findAll({
            raw: true,
            attributes: ['surveyId', 'questionId', 'required'],
            order: ['line'],
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
        const attributes = ['id', 'meta', 'status', 'type'];
        if (options.admin) {
            attributes.push('authorId');
        }
        let opt = { where: { id }, raw: true, attributes };
        if (options.override) {
            opt = _.assign({}, opt, options.override);
        }
        return this.db.Survey.findOne(opt)
            .then((survey) => {
                if (!survey) {
                    return RRError.reject('surveyNotFound');
                }
                if (survey.meta === null) {
                    delete survey.meta; // eslint-disable-line no-param-reassign
                }
                if (options.override) {
                    return survey;
                }
                return this.answerRule.getSurveyAnswerRules({ surveyId: survey.id })
                    .then(answerRuleInfos => this.updateText(survey, options.language)
                        .then(() => {
                            const enableWhen = answerRuleInfos.reduce((r, p) => {
                                const { questionId, sectionId, rule } = p;
                                if (!(questionId || sectionId)) {
                                    r.push(rule);
                                }
                                return r;
                            }, []);
                            if (enableWhen.length) {
                                survey.enableWhen = enableWhen; // eslint-disable-line no-param-reassign, max-len
                            }
                        })
                        .then(() => this.surveyQuestion.listSurveyQuestions(survey.id))
                        .then((surveyQuestions) => {
                            const ids = _.map(surveyQuestions, 'questionId');
                            const language = options.language;
                            return this.question.listQuestions({ scope: 'complete', ids, language, isIdentifying: true })
                                .then((questions) => {
                                    const qxMap = _.keyBy(questions, 'id');
                                    let qxs = surveyQuestions.map((surveyQuestion) => {
                                        const result = Object.assign(qxMap[surveyQuestion.questionId], { required: surveyQuestion.required }); // eslint-disable-line max-len
                                        return result;
                                    });
                                    qxs = qxs.filter(qx => !!qx); // Remove null and undefined
                                    answerRuleInfos.forEach(({ questionId, rule }) => {
                                        if (questionId) {
                                            const question = qxMap[questionId];
                                            if (!question.enableWhen) {
                                                question.enableWhen = [];
                                            }
                                            question.enableWhen.push(rule);
                                        }
                                    });
                                    return qxs;
                                });
                        })
                        .then(questions => this.surveySection.getSectionsForSurveyTx(survey.id, questions, answerRuleInfos, options.language) // eslint-disable-line max-len
                            .then((result) => {
                                if (!result) {
                                    survey.questions = questions; // eslint-disable-line no-param-reassign, max-len
                                    return survey;
                                }
                                const { sections, innerQuestionSet } = result;
                                if (sections && sections.length) {
                                    survey.sections = sections; // eslint-disable-line no-param-reassign, max-len
                                } else {
                                    survey.questions = questions.filter(qx => !innerQuestionSet.has(qx.id)); // eslint-disable-line max-len, no-param-reassign
                                }
                                return survey;
                            })));
            })
            .then((survey) => {
                if (!options.admin) {
                    return survey;
                }
                return this.db.SurveyConsent.findAll({
                    where: { surveyId: survey.id },
                    raw: true,
                    attributes: ['consentTypeId'],
                    order: ['consent_type_id'],
                })
                    .then(records => records.map(r => r.consentTypeId))
                    .then((consentTypeIds) => {
                        if (consentTypeIds.length) {
                            survey.consentTypeIds = _.uniq(consentTypeIds); // eslint-disable-line max-len, no-param-reassign
                        }
                        return survey;
                    });
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

    getAnsweredSurvey(userId, id, options = {}) {
        return this.getSurvey(id, options)
            .then(survey => this.answer.getAnswers({
                userId,
                surveyId: survey.id,
                isIdentifying: options.isIdentifying,
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
                const questionAsParent = Object.assign({
                    id: baseObject.id, parentQuestionId: id,
                });
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

    exportSurveys() {
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
                const converter = new ExportCSVConverter({
                    fields: [
                        'id', 'name', 'description', 'parentSectionId',
                        'parentQuestionId', 'sectionId', 'questionId', 'required',
                    ],
                });
                return converter.dataToCSV(lines);
            });
    }

    importToDb(surveys, surveyQuestions, surveySections, surveySectionQuestions, options = {}) {
        return this.transaction((transaction) => {
            const idMap = {};
            const promises = surveys.map((survey) => {
                const { id: importId, name, description, meta } = survey;
                const record = meta ? { meta } : {};
                const fields = _.omit(record, ['name', 'description', 'id']);
                return this.db.Survey.create(fields, { transaction })
                    .then(({ id }) => this.createTextTx({ id, name, description }, transaction))
                    .then(({ id }) => { idMap[importId] = id; });
            });
            return SPromise.all(promises)
                .then(() => {
                    surveyQuestions.forEach((surveyQuestion) => {
                        const newSurveyId = idMap[surveyQuestion.surveyId];
                        Object.assign(surveyQuestion, { surveyId: newSurveyId });
                    });
                    return this.surveyQuestion.importSurveyQuestionsTx(surveyQuestions, transaction); // eslint-disable-line max-len
                })
                .then(() => {
                    surveySections.forEach((surveySection) => {
                        const newSurveyId = idMap[surveySection.surveyId];
                        Object.assign(surveySection, { surveyId: newSurveyId });
                    });
                    return this.surveySection.importSurveySectionsTx(surveySections, surveySectionQuestions, transaction); // eslint-disable-line max-len
                })
                .then(() => {
                    if (options.sourceType) {
                        const type = options.sourceType;
                        const promises2 = _.transform(idMap, (r, surveyId, identifier) => {
                            const record = { type, identifier, surveyId };
                            const promise = this.surveyIdentifier.createSurveyIdentifier(record, transaction); // eslint-disable-line max-len
                            r.push(promise);
                            return r;
                        }, []);
                        return SPromise.all(promises2).then(() => idMap);
                    }
                    return idMap;
                });
        });
    }

    importSurveys(stream, maps, options = {}) {
        const questionIdMap = _.toPairs(maps.questionIdMap).reduce((r, pair) => {
            r[pair[0]] = pair[1].questionId;
            return r;
        }, {});
        const converter = new ImportCSVConverter({ checkType: false });
        return converter.streamToRecords(stream)
            .then(records => records.map((record) => {
                const idFields = [
                    'sectionId', 'questionId', 'parentSectionId', 'parentQuestionId',
                ];
                const newRecord = _.omit(record, idFields);
                ['sectionId', 'parentSectionId'].forEach((field) => {
                    const value = record[field];
                    if (value) {
                        const newValue = maps.sectionIdMap[value];
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
                            const section = {
                                surveyId: id, sectionId: record.sectionId, line: index,
                            };
                            surveySections.push(section);
                            sectionMap.set(record.sectionId, index);
                            const { parentSectionId, parentQuestionId } = record;
                            if (parentSectionId) {
                                const parentIndex = sectionMap.get(parentSectionId);
                                if (parentIndex === undefined) {
                                    const errCode = 'surveyImportMissingParentSectionId';
                                    throw new RRError(errCode, parentSectionId);
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
                return this.importToDb(surveys, surveyQuestions, surveySections, surveySectionQuestions, options); // eslint-disable-line no-param-reassign, max-len
            });
    }
};
