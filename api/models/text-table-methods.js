'use strict';

const _ = require('lodash');

module.exports = function (sequelize, tableName, parentIdField, textFields = ['text']) {
    return {
        createTextTx(input, tx) {
            const Table = sequelize.models[tableName];
            const language = input.language || 'en';
            const where = { language };
            where[parentIdField] = input[parentIdField];
            return Table.destroy({ where }, { transaction: tx })
                .then(() => {
                    const record = _.cloneDeep(input);
                    record.language = language;
                    return Table.create(record, { transaction: tx })
                        .then(() => input[parentIdField]);
                });
        },
        createText(input) {
            return sequelize.transaction(tx => {
                return this.createTextTx(input, tx);
            });
        },
        getText(parentId, language = 'en') {
            const Table = sequelize.models[tableName];
            const where = { language };
            where[parentIdField] = parentId;
            let query = { where, raw: true, attributes: textFields };
            return Table.findOne(query)
                .then(result => {
                    if ((language === 'en') || (!result)) {
                        return result;
                    }
                    query.where.language = 'en';
                    return Table.findOne(query);
                });
        },
        updateText(parent, language) {
            return this.getText(parent.id, language)
                .then(result => {
                    textFields.forEach(field => (parent[field] = result[field]));
                    return parent;
                });
        },
        getAllTexts(ids, language = 'en') {
            const Table = sequelize.models[tableName];
            const options = { raw: true, attributes: [parentIdField, ...textFields] };
            if (language === 'en') {
                options.language = 'en';
            } else {
                _.set(`language.$in`, ['en', language]);

            }
            if (ids) {
                _.set(`where.${parentIdField}.$in`, ids);
            }
            return Table.findAll(options)
                .then(records => {
                    if (language === 'en') {
                        return _.keyBy(records, parentIdField);
                    }
                    const enRecords = _.remove(records, r => r.language === 'en');
                    const map = _.keyBy(records, parentIdField);
                    enRecords.forEach(record => {
                        const parentId = record[parentIdField];
                        if (!map[parentId]) {
                            map[parentId] = record;
                            records.push(record);
                        }
                    });
                    return map;
                });
        },
        updateAllTexts(parents, language) {
            const ids = _.map(parents, 'id');
            return this.getAllTexts(ids, language)
                .then(map => {
                    parents.forEach(parent => {
                        const r = map[parent.id];
                        textFields.forEach(field => (parent[field] = r[field]));
                    });
                    return parents;
                });
        }
    };
};
