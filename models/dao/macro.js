'use strict';

const Base = require('./base');
const SPromise = require('../../lib/promise');

module.exports = class Macro extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    createSurveys(surveys, userId = 1) {
        return this.transaction((transaction) => {
            const pxs = surveys.map((survey) => {
                const px = this.survey.createSurveyTx(survey, userId, transaction);
                return px;
            });
            pxs[0] = pxs[0].then((id) => {
                const px = this.profileSurvey.createProfileSurveyIdTx(id, transaction);
                return px.then(() => id);
            });
            return SPromise.all(pxs);
        });
    }
};
