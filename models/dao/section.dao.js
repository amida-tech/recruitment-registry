'use strict';

const db = require('../db');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const Translatable = require('./translatable');
const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

module.exports = class SectionDAO extends Translatable {
    constructor() {
        super('section_text', 'sectionId', ['name', 'description'], { name: true, description: true });
    }

    createSectionTx(section, transaction) {
        const { type, name, description } = section;
        return db.Section.create({ type }, { transaction })
            .then(({ id }) => {
                if (name) {
                    return this.createTextTx({ name, description, id }, transaction);
                }
                return { id };
            });
    }

    createSection(section) {
        return db.sequelize.transaction(transaction => this.createSectionTx(section, transaction));
    }

    getSection(id, options = {}) {
        return db.Section.findById(id, { raw: true, attributes: ['id'] })
            .then((section) => {
                if (!section) {
                    return RRError.reject('sectionNotFound');
                }
                return this.updateText(section, options.language);
            });
    }

    deleteSection(id) {
        return db.Section.destroy({ where: { id } });
    }

    listSections(options = {}) {
        return db.Section.findAll({ raw: true, attributes: ['id'] })
            .then(sections => this.updateAllTexts(sections, options.language));
    }

    exportSections() {
        return this.listSections()
            .then((sections) => {
                const converter = new ExportCSVConverter();
                return converter.dataToCSV(sections);
            });
    }

    importSections(stream) {
        const converter = new ImportCSVConverter();
        return converter.streamToRecords(stream)
            .then((records) => {
                if (!records.length) {
                    return {};
                }
                return db.sequelize.transaction((transaction) => {
                    const idMap = {};
                    const promises = records.map((record) => {
                        const recordId = record.id;
                        const section = { name: record.name };
                        if (record.description) {
                            section.description = record.description;
                        }
                        return this.createSectionTx(section, transaction)
                            .then(({ id }) => { idMap[recordId] = id; });
                    });
                    return SPromise.all(promises).then(() => idMap);
                });
            });
    }
};
