'use strict';

const _ = require('lodash');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const importUtil = require('../../import/import-util');
const Translatable = require('./translatable');
const ExportCSVConverter = require('../../export/csv-converter.js');
const ImportCSVConverter = require('../../import/csv-converter.js');

const textFields = ['name', 'description'];

module.exports = class SectionDAO extends Translatable {
    constructor(db) {
        super(db, 'SectionText', 'sectionId', textFields, { name: true, description: true });
        this.db = db;
    }

    createSectionTx(section, transaction) {
        const { meta, name, description } = section;
        const fields = {};
        if (meta) {
            Object.assign(fields, { meta });
        }
        return this.db.Section.create(fields, { transaction })
            .then(({ id }) => {
                if (name) {
                    return this.createTextTx({ name, description, id }, transaction);
                }
                return { id };
            });
    }

    createSectionsTx(sections, transaction) {
        const pxs = sections.map(section => this.createSectionsTx(section, transaction));
        return SPromise.all(pxs).then((results => results.map(({ id }) => id)));
    }

    createSection(section) {
        return this.transaction(transaction => this.createSectionTx(section, transaction));
    }

    getSection(id, options = {}) {
        return this.db.Section.findById(id, { raw: true, attributes: ['id', 'meta'] })
            .then((section) => {
                if (!section) {
                    return RRError.reject('sectionNotFound');
                }
                const r = _.omitBy(section, _.isNil);
                return this.updateText(r, options.language);
            });
    }

    deleteSection(id) {
        return this.db.Section.destroy({ where: { id } });
    }

    listSections(options = {}) {
        const attributes = ['id'];
        if (options.scope === 'export') {
            attributes.push('meta');
        }
        return this.db.Section.findAll({ raw: true, attributes })
            .then(sections => sections.map(section => _.omitBy(section, _.isNil)))
            .then(sections => this.updateAllTexts(sections, options.language));
    }

    comparePatchSectionTx(section, patch, language, transaction) {
        const id = section.id;
        return SPromise.resolve()
            .then(() => {
                const sectionText = _.pick(section, textFields);
                const patchText = _.pick(patch, textFields);
                if (!_.isEqual(sectionText, patchText)) {
                    Object.assign(patchText, { id, language });
                    return this.createTextTx(patchText, transaction);
                }
                return null;
            })
            .then(() => {
                let { meta } = patch;
                if (!_.isEqual(section.meta, meta)) {
                    meta = meta || null;
                    return this.db.Section.update({ meta }, { where: { id }, transaction });
                }
                return null;
            });
    }

    patchSectionPairsTx(pairs, language, transaction) {
        if (pairs && pairs.length) {
            const pxs = pairs.map((pair) => {
                const { object, patch } = pair;
                return this.comparePatchSectionTx(object, patch, language, transaction);
            });
            return SPromise.all(pxs);
        }
        return SPromise.resolve();
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
                return this.transaction((transaction) => {
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
