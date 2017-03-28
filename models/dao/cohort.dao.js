'use strict';

const _ = require('lodash');

const RRError = require('../../lib/rr-error');
const Base = require('./base');

const rekeyFilterName = function (cohort) {
    const r = _.omit(cohort, 'filter.name');
    r.name = cohort['filter.name'];
    return r;
};

module.exports = class CohortDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    findOptions() {
        const created = this.timestampColumn('cohort', 'created');
        const attributes = ['id', created];
        const include = [{ model: this.db.Filter, as: 'filter', attributes: ['name'] }];
        return { raw: true, attributes, include };
    }

    createCohort({ filterId, count }) {
        return this.filter.getFilter(filterId)
            .then((filter) => {
                if (!filter) {
                    return RRError.reject('cohortNoSuchFilter');
                }
                return this.db.Cohort.create({ filterId }).then(() => filter);
            })
            .then(filter => this.answer.searchUsers(filter))
            .then((userIds) => {
                const ids = userIds.map(({ userId }) => userId);
                if (count && count > ids.length) {
                    return this.answer.exportForUsers(ids);
                }
                const limitedIds = _.sampleSize(ids, count);
                return this.answer.exportForUsers(limitedIds);
            });
    }

    getCohort(id) {
        const findOptions = this.findOptions();
        return this.db.Cohort.findById(id, findOptions).then(rekeyFilterName);
    }

    patchCohort(id, { count }) {
        return this.db.Cohort.findById(id, { raw: true, attributes: ['filterId'] })
            .then((record) => {
                if (!record) {
                    return RRError.reject('cohortNoSuchCohort');
                }
                return this.filter.getFilter(record.filterId);
            })
            .then(filter => this.answer.searchUsers(filter))
            .then((userIds) => {
                const ids = userIds.map(({ userId }) => userId);
                if (count && count > ids.length) {
                    return this.answer.exportForUsers(ids);
                }
                const limitedIds = _.sampleSize(ids, count);
                return this.answer.exportForUsers(limitedIds);
            });
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
};
