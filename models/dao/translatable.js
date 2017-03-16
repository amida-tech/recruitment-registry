'use strict';

const _ = require('lodash');

const SPromise = require('../../lib/promise');

module.exports = class Translatable {
    constructor(tableName, parentIdField, textFields = ['text'], optionals = {}) {
        this.tableName = tableName;
        this.parentIdField = parentIdField;
        this.textFields = textFields;
        this.optionals = optionals;
    }

    createTextTx(input, transaction) {
        const Table = this.db.sequelize.models[this.tableName];
        const parentIdField = this.parentIdField;
        const language = input.language || 'en';
        const where = { language };
        where[parentIdField] = input.id;
        return Table.destroy({ where, transaction })
            .then(() => {
                const record = { language };
                record[parentIdField] = input.id;
                this.textFields.forEach((field) => {
                    let value = input[field];
                    if (value === undefined) {
                        value = null;
                    }
                    record[field] = value;
                });
                return Table.create(record, { transaction })
                    .then(() => input);
            });
    }

    deleteTextTx(parentId, transaction) {
        const Table = this.db.sequelize.models[this.tableName];
        const parentIdField = this.parentIdField;
        const where = {
            [parentIdField]: parentId,
        };
        return Table.destroy({ where, transaction });
    }

    createMultipleTextsTx(inputs, transaction) {
        const pxs = inputs.map(input => this.createTextTx(input, transaction));
        return SPromise.all(pxs);
    }

    createText(input) {
        return this.db.sequelize.transaction(transaction => this.createTextTx(input, transaction));
    }

    createMultipleTexts(input) {
        return this.db.sequelize.transaction(transaction => this.createMultipleTextsTx(input, transaction));
    }

    getText(parentId, language = 'en') {
        const Table = this.db.sequelize.models[this.tableName];
        const where = { language };
        where[this.parentIdField] = parentId;
        const query = { where, raw: true, attributes: this.textFields };
        return Table.findOne(query)
            .then((result) => {
                if ((language === 'en') || result) {
                    return result;
                }
                query.where.language = 'en';
                return Table.findOne(query);
            });
    }

    updateTextFields(parent, fieldValues) {
        if (fieldValues) {
            this.textFields.forEach((field) => {
                const value = fieldValues[field];
                if (value !== null) {
                    parent[field] = fieldValues[field];
                } else if (!this.optionals[field]) {
                    parent[field] = '';
                }
            });
        }
        return parent;
    }

    updateText(parent, language) {
        return this.getText(parent.id, language)
            .then(result => this.updateTextFields(parent, result));
    }

    getAllTexts(ids, language = 'en') {
        const Table = this.db.sequelize.models[this.tableName];
        const parentIdField = this.parentIdField;
        const options = { raw: true, attributes: [parentIdField, 'language', ...this.textFields] };
        if (language === 'en') {
            _.set(options, 'where.language', 'en');
        } else {
            _.set(options, 'where.language.$in', ['en', language]);
        }
        _.set(options, `where.${parentIdField}.$in`, ids);
        return Table.findAll(options)
            .then((records) => {
                if (language === 'en') {
                    return _.keyBy(records, parentIdField);
                }
                const enRecords = _.remove(records, r => r.language === 'en');
                const map = _.keyBy(records, parentIdField);
                enRecords.forEach((record) => {
                    const parentId = record[parentIdField];
                    if (!map[parentId]) {
                        map[parentId] = record;
                        records.push(record);
                    }
                });
                return map;
            });
    }

    updateAllTexts(parents, language, idField = 'id') {
        const ids = _.map(parents, idField);
        return this.getAllTexts(ids, language)
            .then((map) => {
                parents.forEach(parent => this.updateTextFields(parent, map[parent[idField]]));
                return parents;
            });
    }
};
