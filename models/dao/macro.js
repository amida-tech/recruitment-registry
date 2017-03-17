'use strict';

const SPromise = require('../../lib/promise');

module.exports = class Macro {
    constructor(db, dependencies) {
        Object.assign(this, dependencies);
        this.db = db;
    }

    createSurveys(surveys) {
        return this.db.sequelize.transaction((transaction) => {
            const pxs = surveys.map((survey) => {
                const px = this.survey.createSurveyTx(survey, transaction);
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
