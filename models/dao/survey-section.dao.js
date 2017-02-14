'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const SurveySection = db.SurveySection;
const SurveySectionQuestion = db.SurveySectionQuestion;

module.exports = class SectionDAO extends Translatable {
    constructor() {
        super('survey_section_text', 'surveySectionId', ['name'], { name: true });
    }

    createSurveySectionTx({ name, surveyId, parentQuestionId, line, type, parentIndex }, ids, transaction) {
        const parentId = parentIndex === null ? null : ids[parentIndex];
        const record = { surveyId, line, type, parentId };
        if (parentQuestionId) {
            record.parentQuestionId = parentQuestionId;
        }
        return SurveySection.create(record, { transaction })
            .then(({ id }) => {
                ids.push(id);
                if (name) {
                    return this.createTextTx({ id, name }, transaction).then(() => ids);
                } else {
                    return this.deleteTextTx(id, transaction).then(() => {
                        return ids;
                    });
                }
            });
    }

    bulkCreateFlattenedSectionsForSurveyTx(surveyId, surveyQuestionIds, flattenedSections, transaction) { // TODO: Use sequelize bulkCreate with 4.0
        if (!flattenedSections.length) {
            return SurveySection.destroy({ where: { surveyId }, transaction });
        }
        return SurveySection.destroy({ where: { surveyId }, transaction })
            .then(() => {
                return flattenedSections.reduce((r, { parentIndex, questionIndex, line, name, type }) => {
                    const record = { name, surveyId, line, type, parentIndex };
                    if (questionIndex !== undefined) {
                        record.parentQuestionId = surveyQuestionIds[questionIndex];
                    }
                    if (r === null) {
                        return this.createSurveySectionTx(record, [], transaction);
                    } else {
                        return r.then(ids => this.createSurveySectionTx(record, ids, transaction));
                    }
                }, null);
            })
            .then((sectionIds => {
                const promises = flattenedSections.reduce((r, { indices }, line) => {
                    if (!indices) {
                        return r;
                    }
                    const questionIds = indices.map(index => surveyQuestionIds[index]);
                    if (questionIds) {
                        const surveySectionId = sectionIds[line];
                        questionIds.forEach(questionId => {
                            const record = { surveySectionId, questionId, line };
                            const promise = SurveySectionQuestion.create(record, { transaction });
                            r.push(promise);
                        });
                    }
                    return r;
                }, []);
                return SPromise.all(promises).then(() => sectionIds);
            }));
    }

    getSectionsForSurveyTx(surveyId, questions, answerRuleInfos, language) {
        const questionMap = new Map(questions.map(question => [question.id, question]));
        return SurveySection.findAll({
                where: { surveyId },
                raw: true,
                order: 'line',
                attributes: ['id', 'type', 'parentId', 'parentQuestionId']
            })
            .then(sections => {
                if (!sections.length) {
                    return null;
                }
                return this.updateAllTexts(sections, language)
                    .then(sections => {
                        const ids = sections.reduce((r, section) => {
                            const { id, type, parentQuestionId } = section;
                            if (type === 'question') {
                                r.push(id);
                            }
                            if (parentQuestionId) {
                                const question = questionMap.get(parentQuestionId);
                                question.section = section;
                                delete section.parentId;
                            } else {
                                delete section.parentQuestionId;
                            }
                            return r;
                        }, []);
                        return SurveySectionQuestion.findAll({
                                where: { surveySectionId: { $in: ids } },
                                raw: true,
                                order: 'line',
                                attributes: ['surveySectionId', 'questionId']
                            })
                            .then(records => {
                                const map = sections.reduce((r, section) => {
                                    r[section.id] = section;
                                    if (section.type === 'question') {
                                        section.questions = [];
                                    }
                                    delete section.type;
                                    return r;
                                }, {});
                                answerRuleInfos.forEach(({ surveySectionId, ruleType, rule }) => {
                                    if (surveySectionId) {
                                        const section = map[surveySectionId];
                                        section[ruleType] = rule;
                                    }
                                });
                                const innerQuestionSet = new Set();
                                records.forEach(record => {
                                    const section = map[record.surveySectionId];
                                    const question = questionMap.get(record.questionId);
                                    section.questions.push(question);
                                    innerQuestionSet.add(question.id);
                                });
                                const result = { innerQuestionSet };
                                result.sections = sections.reduce((r, section) => {
                                    if (section.parentId) {
                                        const parent = map[section.parentId];
                                        if (!parent.sections) {
                                            parent.sections = [];
                                        }
                                        parent.sections.push(section);
                                        delete section.parentId;
                                    } else if (section.parentQuestionId) {
                                        delete section.parentQuestionId;
                                    } else {
                                        r.push(section);
                                        delete section.parentId;
                                    }
                                    return r;
                                }, []);
                                return result;
                            });
                    });
            });
    }

    updateMultipleSectionNamesTx(sections, language, transaction) {
        const inputs = sections.map(({ id, name }) => ({ id, name, language }));
        return this.createMultipleTextsTx(inputs, transaction);
    }

    deleteSurveySectionsTx(surveyId, transaction) {
        return SurveySection.destroy({ where: { surveyId }, transaction });
    }
};
