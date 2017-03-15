'use strict';

const _ = require('lodash');

const db = require('../db');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const importUtil = require('../../import/import-util');
const Translatable = require('./translatable');
const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

module.exports = class SectionDAO extends Translatable {
    constructor() {
        super('section_text', 'sectionId', ['name', 'description'], { name: true, description: true });
    }

    createSectionTx(section, transaction) {
        const { meta, name, description } = section;
        const fields = {};
        if (meta) {
            Object.assign(fields, { meta });
        }
        return db.Section.create(fields, { transaction })
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
        return db.Section.findById(id, { raw: true, attributes: ['id', 'meta'] })
            .then((section) => {
                if (!section) {
                    return RRError.reject('sectionNotFound');
                }
                const r = _.omitBy(section, _.isNil);
                return this.updateText(r, options.language);
            });
    }

    deleteSection(id) {
        return db.Section.destroy({ where: { id } });
    }

    listSections(options = {}) {
        const attributes = ['id'];
        if (options.scope === 'export') {
            attributes.push('meta');
        }
        return db.Section.findAll({ raw: true, attributes })
            .then(sections => sections.map(section => _.omitBy(section, _.isNil)))
            .then(sections => this.updateAllTexts(sections, options.language));
    }

    exportSections() {
        return this.listSections({ scope: 'export' })
            .then((sections) => {
                const converter = new ExportCSVConverter();
                return converter.dataToCSV(sections);
            });
    }

    importSections(stream, options = {}) {
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
                        importUtil.updateMeta(section, record, options);
                        return this.createSectionTx(section, transaction)
                            .then(({ id }) => { idMap[recordId] = id; });
                    });
                    return SPromise.all(promises).then(() => idMap);
                });
            });
    }
};
