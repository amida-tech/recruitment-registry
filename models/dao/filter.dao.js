'use strict';

const _ = require('lodash');

const Base = require('./base');
const SPromise = require('../../lib/promise');

module.exports = class FilterDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    attributes() {
        const created = this.timestampColumn('filter', 'created');
        return ['id', 'name', 'maxCount', created];
    }

    createFilterTx({ name, maxCount, questions }, transaction) {
        const record = { name };
        if (maxCount) {
            record.maxCount = maxCount;
        }
        return this.db.Filter.create(record, { transaction })
            .then(({ id }) => {
                const filterAnswers = { filterId: id, questions };
                return this.filterAnswer.createFilterAnswersTx(filterAnswers, transaction)
                    .then(() => ({ id }));
            });
    }

    createFilter(filter) {
        return this.transaction(tx => this.createFilterTx(filter, tx));
    }

    getFilter(id) {
        const attributes = this.attributes();
        return this.db.Filter.findById(id, { raw: true, attributes })
            .then((record) => {
                const filter = _.omitBy(record, _.isNil);
                return this.filterAnswer.getFilterAnswers(id)
                    .then((questions) => {
                        filter.questions = questions;
                        return filter;
                    });
            });
    }

    deleteFilterTx(id, transaction) {
        return this.db.Filter.destroy({ where: { id }, transaction })
            .then(() => this.filterAnswer.deleteFilterAnswersTx(id, transaction));
    }

    deleteFilter(id) {
        return this.transaction(tx => this.deleteFilterTx(id, tx));
    }

    listFilters() {
        const attributes = this.attributes();
        return this.db.Filter.findAll({ raw: true, attributes, order: 'id' })
            .then(records => records.map(record => _.omitBy(record, _.isNil)));
    }

    patchFilterTx(id, { name, maxCount, questions }, transaction) {
        return SPromise.resolve()
            .then(() => {
                if (name || maxCount) {
                    const record = {};
                    if (name) {
                        record.name = name;
                    }
                    if (maxCount) {
                        record.maxCount = maxCount;
                    }
                    return this.db.Filter.update(record, { where: { id }, transaction });
                }
                return null;
            })
            .then(() => {
                if (questions) {
                    const questionPatch = { filterId: id, questions };
                    return this.filterAnswer.replaceFilterAnswersTx(questionPatch, transaction);
                }
                return null;
            });
    }

    patchFilter(id, filter) {
        return this.transaction(tx => this.patchFilterTx(id, filter, tx));
    }
};
