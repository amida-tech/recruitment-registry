'use strict';

const db = require('./db');
const dao = require('./dao');

const SPromise = require('../lib/promise');

const sequelize = db.sequelize;

const createSurveys = function (surveys) {
    return sequelize.transaction((transaction) => {
        const promises = surveys.map(survey => dao.survey.createSurveyTx(survey, transaction));
        return SPromise.all(promises)
            .then(ids => dao.profileSurvey.createProfileSurveyIdTx(ids[0], transaction)
                    .then(() => ids));
    });
};

module.exports = {
    createSurveys,
};
