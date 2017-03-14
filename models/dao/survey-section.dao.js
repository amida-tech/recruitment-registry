'use strict';

const _ = require('lodash');

const SPromise = require('../../lib/promise');

module.exports = class SectionDAO {
    constructor(db, dependencies) {
        Object.assign(this, dependencies);
        this.db = db;
    }

    createSurveySectionTx({ name, description, surveyId, parentQuestionId, line, parentIndex }, ids, transaction) {
        return this.section.createSectionTx({ name, description }, transaction)
            .then(({ id: sectionId }) => {
                const parentId = parentIndex === null || parentIndex === undefined ? null : ids[parentIndex].id;
                const record = { surveyId, sectionId, parentId, line };
                if (parentQuestionId) {
                    record.parentQuestionId = parentQuestionId;
                }
                return this.db.SurveySection.create(record, { transaction })
                    .then(({ id }) => {
                        ids.push({ id, sectionId });
                        return ids;
                    });
            });
    }

    bulkCreateFlattenedSectionsForSurveyTx(surveyId, surveyQuestionIds, flattenedSections, transaction) { // TODO: Use sequelize bulkCreate with 4.0
        if (!flattenedSections.length) {
            return this.db.SurveySection.destroy({ where: { surveyId }, transaction });
        }
        return this.db.SurveySection.destroy({ where: { surveyId }, transaction })
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
                        questionIds.forEach((questionId, questionLine) => {
                            const record = { surveySectionId, questionId, line: questionLine };
                            const promise = this.db.SurveySectionQuestion.create(record, { transaction });
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
        return this.db.SurveySection.findAll({
            where: { surveyId },
            raw: true,
            order: 'line',
            attributes: ['id', 'sectionId', 'parentId', 'parentQuestionId'],
            include: [{ model: this.db.Section, as: 'section', attributes: ['meta'] }],
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
                        return this.db.SurveySectionQuestion.findAll({
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
                                    const meta = section['section.meta'];
                                    if (meta) {
                                        section.meta = meta;
                                    }
                                    delete section.sectionId;
                                    delete section['section.meta'];
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
        return this.db.SurveySection.destroy({ where: { surveyId }, transaction });
    }

    updateSurveyListExport(surveyMap) {
        return this.db.SurveySection.findAll({
            raw: true,
            attributes: ['id', 'surveyId', 'sectionId', 'parentId', 'parentQuestionId'],
            order: ['surveyId', 'line'],
        })
            .then((surveySections) => {
                if (surveySections.length === 0) {
                    return null;
                }
                const ids = surveySections.map(({ id }) => id);
                return this.surveySectionQuestion.groupSurveySectionQuestions(ids)
                    .then((sectionQuestionMap) => {
                        let currentSurveyId = null;
                        let currentSurvey = null;
                        const sectionMap = new Map();
                        const questionMap = new Map();
                        const sectionQuestionSet = new Set();
                        surveySections.forEach((surveySection) => {
                            if (surveySection.surveyId !== currentSurveyId) {
                                if (currentSurvey && currentSurvey.questions) {
                                    currentSurvey.questions = currentSurvey.questions.filter(q => !sectionQuestionSet.has(q.id));
                                }
                                currentSurveyId = surveySection.surveyId;
                                currentSurvey = surveyMap.get(currentSurveyId);
                                currentSurvey.questions.forEach((question) => {
                                    questionMap.set(question.id, question);
                                });
                            }
                            const section = { id: surveySection.sectionId };
                            if (surveySection.parentId === null && surveySection.parentQuestionId === null) {
                                if (!currentSurvey.sections) {
                                    currentSurvey.sections = [section];
                                    delete currentSurvey.questions;
                                } else {
                                    currentSurvey.sections.push(section);
                                }
                            }
                            const questionIds = sectionQuestionMap.get(surveySection.id);
                            if (questionIds && questionIds.length) {
                                section.questions = questionIds.map(id => questionMap.get(id));
                                questionIds.forEach(id => sectionQuestionSet.add(id));
                                questionIds.forEach(id => sectionQuestionSet.add(id));
                            } else {
                                section.sections = [];
                            }
                            sectionMap.set(surveySection.id, section);
                        });
                        surveySections.forEach(({ id, parentId, parentQuestionId }) => {
                            if (parentId) {
                                const section = sectionMap.get(id);
                                const parentSection = sectionMap.get(parentId);
                                parentSection.sections.push(section);
                                return;
                            }
                            if (parentQuestionId) {
                                const section = sectionMap.get(id);
                                const parentQuestion = questionMap.get(parentQuestionId);
                                if (!parentQuestion.sections) {
                                    parentQuestion.sections = [];
                                }
                                parentQuestion.sections.push(section);
                            }
                        });
                        if (currentSurvey && currentSurvey.questions) {
                            currentSurvey.questions = currentSurvey.questions.filter(q => !sectionQuestionSet.has(q.id));
                        }
                    });
            });
    }

    importSurveySectionsTx(surveySections, surveySectionQuestions, transaction) {
        let promise = SPromise.resolve([]);
        surveySections.forEach((surveySection) => {
            promise = promise.then((ids) => {
                const record = _.omit(surveySection, 'parentIndex');
                const parentIndex = surveySection.parentIndex;
                if (parentIndex !== undefined) {
                    record.parentId = ids[parentIndex];
                }
                return this.db.SurveySection.create(record, { transaction })
                    .then(({ id }) => {
                        ids.push(id);
                        return ids;
                    });
            });
        });
        return promise.then((ids) => {
            const promises = surveySectionQuestions.map((surveySectionQuestion) => {
                const record = _.omit(surveySectionQuestion, 'parentIndex');
                const sectionIndex = surveySectionQuestion.sectionIndex;
                if (sectionIndex !== undefined) {
                    record.surveySectionId = ids[sectionIndex];
                }
                return this.db.SurveySectionQuestion.create(record, { transaction });
            });
            return SPromise.all(promises);
        });
    }
};
