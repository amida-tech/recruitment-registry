'use strict';

const _ = require('lodash');

const RRError = require('../../lib/rr-error');
const Base = require('./base');

module.exports = class CohortDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    findOptions() {
        const created = this.timestampColumn('cohort', 'created');
        const attributes = ['id', 'name', created];
        return { raw: true, attributes };
    }

    createCohort({ filterId, count, name }) {
        return this.filter.getFilter(filterId)
            .then((filter) => {
                if (!filter) {
                    return RRError.reject('cohortNoSuchFilter');
                }
                const newCohort = { filterId };
                if (name) {
                    newCohort.name = name;
                } else {
                    newCohort.name = filter.name;
                }
                return this.db.Cohort.create(newCohort).then(() => filter);
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
        return this.db.Cohort.findById(id, findOptions);
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
        return this.db.Cohort.findAll(findOptions);
    }
};
