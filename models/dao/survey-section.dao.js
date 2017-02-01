'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const SurveySection = db.SurveySection;
const SurveySectionQuestion = db.SurveySectionQuestion;

const flattenHiearachy = function flattenHiearachy(sections, result, parentIndex = null) {
    if (!result) {
        result = [];
    }
    sections.forEach((section, line) => {
        result.push({ parentIndex, line, section });
        if (section.sections) {
            flattenHiearachy(section.sections, result, result.length - 1);
        }
    });
    return result;
};

module.exports = class SectionDAO extends Translatable {
    constructor() {
        super('survey_section_text', 'surveySectionId', ['name']);
    }

    createSurveySectionTx({ name, surveyId, line, type, parentIndex }, ids, transaction) {
        const parentId = parentIndex === null ? null : ids[parentIndex];
        return SurveySection.create({ surveyId, line, type, parentId }, { transaction })
            .then(({ id }) => {
                ids.push(id);
                return this.createTextTx({ id, name }, transaction)
                    .then(() => ids);
            });
    }

    bulkCreateSectionsForSurveyTx(surveyId, questionIds, sections, transaction) { // TODO: Use sequelize bulkCreate with 4.0
        const flattenedSections = flattenHiearachy(sections);
        return SurveySection.destroy({ where: { surveyId }, transaction })
            .then(() => {
                return flattenedSections.reduce((r, { parentIndex, line, section }) => {
                    const { name, indices } = section;
                    const type = indices ? 'question' : 'section';
                    const record = { name, surveyId, line, type, parentIndex };
                    if (r === null) {
                        return this.createSurveySectionTx(record, [], transaction);
                    } else {
                        return r.then(ids => this.createSurveySectionTx(record, ids, transaction));
                    }
                }, null);
            })
            .then((sectionIds => {
                const promises = flattenedSections.reduce((r, { section }, line) => {
                    const indices = section.indices;
                    if (indices) {
                        const surveySectionId = sectionIds[line];
                        indices.forEach(index => {
                            const record = { surveySectionId, questionId: questionIds[index], line };
                            const promise = SurveySectionQuestion.create(record, { transaction });
                            r.push(promise);
                        });
                    }
                    return r;
                }, []);
                return SPromise.all(promises).then(() => sectionIds);
            }));
    }

    getSectionsForSurveyTx(surveyId, language) {
        return SurveySection.findAll({
                where: { surveyId },
                raw: true,
                order: 'line',
                attributes: ['id', 'type', 'parentId']
            })
            .then(sections => this.updateAllTexts(sections, language))
            .then(sections => {
                const ids = sections.reduce((r, { id, type }) => {
                    if (type === 'question') {
                        r.push(id);
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
                        records.forEach(record => {
                            const section = map[record.surveySectionId];
                            section.questions.push(record.questionId);
                        });
                        return sections.reduce((r, section) => {
                            if (section.parentId) {
                                const parent = map[section.parentId];
                                if (!parent.sections) {
                                    parent.sections = [];
                                }
                                parent.sections.push(section);
                                delete section.parentId;
                            } else {
                                r.push(section);
                                delete section.parentId;
                            }
                            return r;
                        }, []);
                    });
            });
    }

    updateMultipleSectionNamesTx(sections, language, transaction) {
        const inputs = sections.map(({ id, name }) => ({ id, name, language }));
        return this.createMultipleTextsTx(inputs, transaction);
    }
};
