'use strict';

const db = require('./db');
const dao = require('./dao');

const SPromise = require('../lib/promise');

const sequelize = db.sequelize;

const createSurveys = function (surveys) {
    for (let index = 0; index < surveys.length; ++index) {
        const rejection = dao.survey.validateCreateQuestionsPreTransaction(surveys[index]);
        if (rejection) {
            return rejection;
        }
    }
    return sequelize.transaction(transaction => {
        const promises = surveys.map(survey => {
            return dao.survey.createSurveyTx(survey, transaction);
        });
        return SPromise.all(promises)
            .then(ids => {
                return dao.profileSurvey.createProfileSurveyIdTx(ids[0], transaction)
                    .then(() => ids);
            });
    });
};

module.exports = {
    createSurveys
};
