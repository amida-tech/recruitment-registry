'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const SurveySection = db.SurveySection;
const SurveySectionQuestion = db.SurveySectionQuestion;

module.exports = class SectionDAO extends Translatable {
    constructor() {
        super('survey_section_text', 'surveySectionId', ['name']);
    }

    createSurveySectionTx({ name, surveyId, line, questionIds }, transaction) {
        return SurveySection.create({ surveyId, type: 'question', line }, { transaction })
            .then(({ id }) => {
                return this.createTextTx({ id, name }, transaction)
                    .then(() => {
                        const promises = questionIds.map((questionId, line) => {
                            const record = { surveySectionId: id, questionId, line };
                            return SurveySectionQuestion.create(record, { transaction });
                        });
                        return SPromise.all(promises);
                    })
                    .then(() => id);
            });
    }

    bulkCreateSectionsForSurveyTx(surveyId, questionIds, sections, transaction) { // TODO: Use sequelize bulkCreate with 4.0
        return SurveySection.destroy({ where: { surveyId }, transaction })
            .then(() => {
                const pxs = sections.map(({ name, indices }, line) => {
                    const sectionQuestionIds = indices.map(index => questionIds[index]);
                    return this.createSurveySectionTx({ name, surveyId, line, questionIds: sectionQuestionIds }, transaction);
                });
                return SPromise.all(pxs);
            });
    }

    getSectionsForSurveyTx(surveyId, language) {
        return SurveySection.findAll({
                where: { surveyId },
                raw: true,
                order: 'line',
                attributes: ['id']
            })
            .then(sections => {
                const ids = sections.map(({ id }) => id);
                return SurveySectionQuestion.findAll({
                        where: { surveySectionId: { $in: ids } },
                        raw: true,
                        order: 'line',
                        attributes: ['surveySectionId', 'questionId']
                    })
                    .then(records => {
                        const map = sections.reduce((r, section) => {
                            r[section.id] = section;
                            section.questions = [];
                            return r;
                        }, {});
                        records.forEach(record => {
                            const section = map[record.surveySectionId];
                            section.questions.push(record.questionId);
                        });
                        return sections;
                    });
            })
            .then(sections => this.updateAllTexts(sections, language));
    }

    updateMultipleSectionNamesTx(sections, language, transaction) {
        const inputs = sections.map(({ id, name }) => ({ id, name, language }));
        return this.createMultipleTextsTx(inputs, transaction);
    }
};
