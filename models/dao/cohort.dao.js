'use strict';

const _ = require('lodash');

const Base = require('./base');
const SPromise = require('../../lib/promise');

const rekeyFilterName = function (cohort) {
    const r = _.omit(cohort, 'filter.name');
    r.name = cohort['filter.name'];
    return r;
};

module.exports = class CohortDAO extends Base {
    findOptions() {
        const created = this.timestampColumn('cohort', 'created');
        const attributes = ['id', created];
        const include = [{ model: this.db.Filter, as: 'filter', attributes: ['name'] }];
        return { raw: true, attributes, include };
    }

    createCohort({ filterId }) {
        return this.db.Cohort.create({ filterId })
            .then(({ id }) => this.sendEmail().then(() => ({ id })));
    }

    getCohort(id) {
        const findOptions = this.findOptions();
        return this.db.Cohort.findById(id, findOptions).then(rekeyFilterName);
    }

    patchCohort() { // will accept ({ id })
        return this.sendEmail();
    }

    deleteCohort(id) {
        return this.db.Cohort.destroy({ where: { id } });
    }

    listCohorts() {
        const findOptions = this.findOptions();
        findOptions.order = this.qualifiedCol('cohort', 'created_at');
        return this.db.Cohort.findAll(findOptions)
            .then(cohorts => cohorts.map(rekeyFilterName));
    }

    sendEmail() {
        return SPromise.resolve(); // to be implemented
    }
};
