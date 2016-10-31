'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const textTableMethods = require('./text-table-methods');

const sequelize = db.sequelize;
const Section = db.Section;
const SurveySection = db.SurveySection;

const textHandler = textTableMethods(sequelize, 'section_text', 'sectionId', ['name']);

module.exports = class {
    constructor() {}

    createSectionTx({ name, indices }, tx) {
        return Section.create({ indices }, { transaction: tx })
            .then(({ id, indices }) => textHandler.createTextTx({ id, indices, name }, tx));
    }

    bulkCreateSectionsForSurveyTx(surveyId, sections, tx) { // TODO: Use sequelize bulkCreate with 4.0
        const pxs = sections.map(({ name, indices }) => this.createSectionTx({ name, indices }, tx));
        return SPromise.all(pxs)
            .then(result => {
                return SurveySection.destroy({ where: { surveyId }, transaction: tx })
                    .then(() => {
                        const pxs = result.map(({ id }, line) => SurveySection.create({ surveyId, sectionId: id, line }, { transaction: tx }));
                        return SPromise.all(pxs)
                            .then(() => result);
                    });
            });
    }

    getSectionsForSurveyTx(surveyId, language) {
        return SurveySection.findAll({
                where: { surveyId },
                raw: true,
                order: 'line',
                attributes: ['sectionId']
            })
            .then(sections => {
                const ids = sections.map(({ sectionId }) => sectionId);
                return Section.findAll({
                    where: { id: { $in: ids } },
                    raw: true,
                    attributes: ['id', 'indices']
                });
            })
            .then(sections => textHandler.updateAllTexts(sections, language));
    }

    updateMultipleSectionNamesTx(sections, language, tx) {
        const inputs = sections.map(({ id, name }) => ({ id, name, language }));
        return textHandler.createMultipleTextsTx(inputs, tx);
    }
};
