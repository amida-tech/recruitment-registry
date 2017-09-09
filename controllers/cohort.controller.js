'use strict';

const _ = require('lodash');

const shared = require('./shared.js');
const csvEmailUtil = require('../lib/csv-email-util');
const smtpHelper = require('../lib/smtp-helper');

exports.createCohort = function createCohort(req, res) {
    const allModels = req.app.locals.models;
    const language = _.get(req, 'swagger.params.language.value');
    req.models.cohort.createCohort(req.body, allModels)
        .then(csvEmailUtil.uploadCohortCSV)
        .then((s3Data) => {
            const models = req.models;
            const email = req.user.email;
            const link = s3Data.s3Url;
            return smtpHelper.sendS3LinkEmail(models, email, language, link).then(() => s3Data);
        })
        .then(result => res.status(201).json(result))
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
    const language = _.get(req, 'swagger.params.language.value');
    req.models.cohort.patchCohort(id, req.body)
        .then(csvEmailUtil.uploadCohortCSV)
        .then((s3Data) => {
            const models = req.models;
            const email = req.user.email;
            const link = s3Data.s3Url;
            return smtpHelper.sendS3LinkEmail(models, email, language, link).then(() => s3Data);
        })
        .then(result => res.status(200).json(result))
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
