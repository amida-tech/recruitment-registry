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

    exportForUsers(userIds, count) {
        const ids = userIds.map(({ userId }) => userId);
        if (count && count > ids.length) {
            return this.answer.exportForUsers(ids);
        }
        const limitedIds = _.sampleSize(ids, count);
        return this.answer.exportForUsers(limitedIds);
    }

    searchParticipants(filter, federated) {
        if (federated) {
            return this.answer.localCriteriaToFederatedCriteria(filter)
                .then(fc => this.answer.searchParticipantsIdentifiers(fc));
        }
        return this.answer.searchParticipants(filter);
    }

    createCohort({ filterId, count, name, federated, local }) {
        return this.filter.getFilter(filterId)
            .then((filter) => {
                if (!filter) {
                    return RRError.reject('cohortNoSuchFilter');
                }
                const newCohort = { filterId };
                newCohort.federated = federated || false;
                newCohort.local = local || false;
                if (name) {
                    newCohort.name = name;
                } else {
                    newCohort.name = filter.name;
                }
                return this.db.Cohort.create(newCohort)
                    .then(({ id }) => {
                        const cohortId = { cohortId: id };
                        return this.getFilterAnswers(filterId)
                            .then(records => records.map(r => Object.assign(r, cohortId)))
                            .then(records => this.db.CohortAnswer.bulkCreate(records))
                            .then(() => filter);
                    });
            })
            .then(filter => this.searchParticipants(filter, federated))
            .then(userIds => this.exportForUsers(userIds, count));
    }

    getCohort(id) {
        const findOptions = this.findOptions();
        return this.db.Cohort.findById(id, findOptions);
    }

    patchCohort(id, { count }) {
        return this.db.Cohort.findById(id, {
            raw: true,
            attributes: ['federated', 'local'],
        })
            .then(({ federated }) => {
                const where = { cohortId: id };
                const order = this.qualifiedCol('cohort_answer', 'id');
                return answerCommon.getFilterAnswers(this, this.db.CohortAnswer, { where, order })
                    .then(questions => this.searchParticipants({ questions }, federated))
                    .then(userIds => this.exportForUsers(userIds, count));
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
