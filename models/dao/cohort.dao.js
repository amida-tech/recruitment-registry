'use strict';

const _ = require('lodash');

const RRError = require('../../lib/rr-error');
const Base = require('./base');
const answerCommon = require('./answer-common');

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

    getFilterAnswers(filterId) {
        const where = { filterId };
        const order = this.qualifiedCol('filter_answer', 'id');
        const attributes = ['questionId', 'questionChoiceId', 'value'];
        const findOptions = { raw: true, where, attributes, order };
        return this.db.FilterAnswer.findAll(findOptions);
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
                return this.db.Cohort.create(newCohort)
                    .then(({ id }) => {
                        const cohortId = { cohortId: id };
                        return this.getFilterAnswers(filterId)
                            .then(records => records.map(record => Object.assign(record, cohortId)))
                            .then(records => this.db.CohortAnswer.bulkCreate(records))
                            .then(() => filter);
                    });
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
        const where = { cohortId: id };
        const order = this.qualifiedCol('cohort_answer', 'id');
        return answerCommon.getFilterAnswers(this, this.db.CohortAnswer, { where, order })
            .then(questions => this.answer.searchUsers({ questions }))
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
