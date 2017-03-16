'use strict';

const SPromise = require('../../lib/promise');

module.exports = class Macro {
    constructor(db, dependencies) {
        Object.assign(this, dependencies);
        this.db = db;
    }

    createSurveys(surveys) {
        return this.db.sequelize.transaction((transaction) => {
            const promises = surveys.map(survey => this.survey.createSurveyTx(survey, transaction));
            return SPromise.all(promises)
                .then(ids => this.profileSurvey.createProfileSurveyIdTx(ids[0], transaction)
                        .then(() => ids));
        });
    }
};
