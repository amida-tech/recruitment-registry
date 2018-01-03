'use strict';

const _ = require('lodash');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const Base = require('./base');
const answerCommon = require('./answer-common');
const registryCommon = require('./registry-common');
const ExportCSVConverter = require('../../export/csv-converter.js');

const processFederatedCohortForRegistry = function (registry, federatedModels, filter) {
    const { name, schema, url } = registry;
    if (schema) {
        const models = federatedModels[schema];
        return models.answer.federatedListAnswers(filter);
    }
    return registryCommon.requestPost(name, filter, url, 'answers/federated');
};

const basicExportFields = [
    'questionText', 'questionChoiceText', 'identifier', 'value',
];

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
        const order = ['id'];
        const attributes = ['questionId', 'exclude', 'questionChoiceId', 'value'];
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

    processFederatedCohort(filter, count, federatedModels) {
        return this.answer.localCriteriaToFederatedCriteria(filter)
            .then(fc => this.registry.findRegistries()
                .then((registries) => {
                    const pxs = registries.map((registry) => {
                        const id = registry.id;
                        return processFederatedCohortForRegistry(registry, federatedModels, fc)
                            .then((answers) => {
                                answers.forEach((r) => {
                                    r.registryId = id;
                                });
                                return answers;
                            });
                    });
                    const px = this.answer.federatedListAnswers(fc)
                        .then((answers) => {
                            answers.forEach((r) => {
                                r.registryId = 0;
                            });
                            return answers;
                        });
                    pxs.unshift(px);
                    return SPromise.all(pxs);
                })
                .then(results => results.map((result) => {
                    if (count && count > result.count) {
                        return result;
                    }
                    return _.sampleSize(result, count);
                }))
                .then(results => _.flatten(results))
                .then((answers) => {
                    const fields = ['registryId', 'userId', ...basicExportFields];
                    const converter = new ExportCSVConverter({ fields });
                    return converter.dataToCSV(answers);
                }));
    }

    processCohort(filter, count, federated, local, federatedModels) {
        if (federated && !local) {
            return this.processFederatedCohort(filter, count, federatedModels);
        }
        return this.searchParticipants(filter, federated)
            .then(userIds => this.exportForUsers(userIds, count));
    }

    createCohort({ filterId, count, name, federated, local }, federatedModels) {
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
                newCohort.count = count || 0;
                return this.db.Cohort.create(newCohort)
                    .then(({ id }) => {
                        const cohortId = { cohortId: id };
                        return this.getFilterAnswers(filterId)
                            .then(records => records.map(r => Object.assign(r, cohortId)))
                            .then(records => this.db.CohortAnswer.bulkCreate(records))
                            .then(() => filter);
                    });
            })
            .then(filter => this.processCohort(filter, count, federated, local, federatedModels));
    }

    getCohort(id) {
        const findOptions = this.findOptions();
        findOptions.attributes.push('count');
        return this.db.Cohort.findById(id, findOptions);
    }

    patchCohort(id) {
        return this.db.Cohort.findById(id, {
            raw: true,
            attributes: ['federated', 'local', 'count'],
        })
            .then(({ federated, local, count }) => {
                const where = { cohortId: id };
                const order = ['id'];
                return answerCommon.getFilterAnswers(this, this.db.CohortAnswer, { where, order })
                    .then(questions => this.processCohort({ questions }, count, federated, local));
            });
    }

    deleteCohort(id) {
        return this.db.Cohort.destroy({ where: { id } });
    }

    listCohorts() {
        const findOptions = this.findOptions();
        findOptions.order = ['created_at'];
        return this.db.Cohort.findAll(findOptions);
    }
};
