'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const SurveySection = db.SurveySection;
const SurveySectionQuestion = db.SurveySectionQuestion;

module.exports = class SectionDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createSurveySectionTx({ name, description, surveyId, parentQuestionId, line, parentIndex }, ids, transaction) {
        return this.section.createSectionTx({ name, description }, transaction)
            .then(({ id: sectionId }) => {
                const parentId = parentIndex === null || parentIndex === undefined ? null : ids[parentIndex].id;
                const record = { surveyId, sectionId, parentId, line };
                if (parentQuestionId) {
                    record.parentQuestionId = parentQuestionId;
                }
                return SurveySection.create(record, { transaction })
                    .then(({ id }) => {
                        ids.push({ id, sectionId });
                        return ids;
                    });
            });
    }

    bulkCreateFlattenedSectionsForSurveyTx(surveyId, surveyQuestionIds, flattenedSections, transaction) { // TODO: Use sequelize bulkCreate with 4.0
        if (!flattenedSections.length) {
            return SurveySection.destroy({ where: { surveyId }, transaction });
        }
        return SurveySection.destroy({ where: { surveyId }, transaction })
            .then(() => flattenedSections.reduce((r, { parentIndex, questionIndex, line, name }) => {
                const record = { name, surveyId, line, parentIndex };
                if (questionIndex !== undefined) {
                    record.parentQuestionId = surveyQuestionIds[questionIndex];
                }
                if (r === null) {
                    return this.createSurveySectionTx(record, [], transaction);
                }
                return r.then(ids => this.createSurveySectionTx(record, ids, transaction));
            }, null))
            .then(((sectionIds) => {
                const promises = flattenedSections.reduce((r, { indices }, line) => {
                    if (!indices) {
                        return r;
                    }
                    const questionIds = indices.map(index => surveyQuestionIds[index]);
                    if (questionIds) {
                        const surveySectionId = sectionIds[line].id;
                        questionIds.forEach((questionId) => {
                            const record = { surveySectionId, questionId, line };
                            const promise = SurveySectionQuestion.create(record, { transaction });
                            r.push(promise);
                        });
                    }
                    return r;
                }, []);
                return SPromise.all(promises).then(() => sectionIds.map(sectionId => sectionId.sectionId));
            }));
    }

    getSectionsForSurveyTx(surveyId, questions, answerRuleInfos, language) {
        const questionMap = new Map(questions.map(question => [question.id, question]));
        return SurveySection.findAll({
            where: { surveyId },
            raw: true,
            order: 'line',
            attributes: ['id', 'sectionId', 'parentId', 'parentQuestionId'],
        })
            .then((surveySections) => {
                if (!surveySections.length) {
                    return null;
                }
                return this.section.updateAllTexts(surveySections, language, 'sectionId')
                    .then((surveySections) => {
                        const ids = surveySections.reduce((r, section) => {
                            const { id, parentQuestionId } = section;
                            r.push(id);
                            if (parentQuestionId) {
                                const question = questionMap.get(parentQuestionId);
                                if (!question.sections) {
                                    question.sections = [];
                                }
                                question.sections.push(section);
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
                            attributes: ['surveySectionId', 'questionId'],
                        })
                            .then((records) => {
                                const { idMap, sectionIdMap } = surveySections.reduce((r, section) => {
                                    r.idMap[section.id] = section;
                                    r.sectionIdMap[section.sectionId] = section;
                                    return r;
                                }, { idMap: {}, sectionIdMap: {} });
                                answerRuleInfos.forEach(({ sectionId, rule }) => {
                                    if (sectionId) {
                                        const section = sectionIdMap[sectionId];
                                        if (!section.enableWhen) {
                                            section.enableWhen = [];
                                        }
                                        section.enableWhen.push(rule);
                                    }
                                });
                                const innerQuestionSet = new Set();
                                records.forEach((record) => {
                                    const section = idMap[record.surveySectionId];
                                    const question = questionMap.get(record.questionId);
                                    if (!section.questions) {
                                        section.questions = [];
                                    }
                                    section.questions.push(question);
                                    innerQuestionSet.add(question.id);
                                });
                                const result = { innerQuestionSet };
                                result.sections = surveySections.reduce((r, section) => {
                                    if (section.parentId) {
                                        const parent = idMap[section.parentId];
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
                                    section.id = section.sectionId;
                                    delete section.sectionId;
                                    return r;
                                }, []);
                                return result;
                            });
                    });
            });
    }

    updateMultipleSectionNamesTx(sections, language, transaction) {
        const inputs = sections.map(({ id, name }) => ({ id, name, language }));
        return this.section.createMultipleTextsTx(inputs, transaction);
    }

    deleteSurveySectionsTx(surveyId, transaction) {
        return SurveySection.destroy({ where: { surveyId }, transaction });
    }
};
