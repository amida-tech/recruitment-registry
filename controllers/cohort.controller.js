'use strict';

const _ = require('lodash');

const shared = require('./shared.js');
const csvEmailUtil = require('../lib/csv-email-util.js);

exports.createCohort = function createCohort(req, res) {
    const allModels = req.app.locals.models;
    req.models.cohort.createCohort(req.body, allModels)
        .then(csvEmailUtil.uploadCohortCSV)
        .then((s3Data) => {
            csvEmailutil.sendS3LinkEmail(req.models, s3Data);
            res.status(201).json(s3Data)
        }, err => shared.handleError(res))
        .catch(shared.handleError(res));
};

exports.getCohort = function getCohort(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.cohort.getCohort(id)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};

exports.patchCohort = function patchCohort(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.cohort.patchCohort(id, req.body)
        .then((csvContent) => {
            res.header('Content-disposition', 'attachment; filename=cohort.csv');
            res.type('text/csv');
            res.status(200).send(csvContent);
        })
        .catch(shared.handleError(res));
};

exports.deleteCohort = function deleteCohort(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.cohort.deleteCohort(id)
        .then(() => res.status(204).end())
        .catch(shared.handleError(res));
};

exports.listCohorts = function listCohorts(req, res) {
    req.models.cohort.listCohorts()
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
