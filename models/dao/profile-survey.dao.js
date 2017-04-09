'use strict';

const _ = require('lodash');

const Base = require('./base');

module.exports = class ProfileSurveyDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    getProfileSurveyId() {
        return this.db.ProfileSurvey.findOne({
            raw: true,
            attributes: ['surveyId'],
        })
            .then((record) => {
                if (record) {
                    return record.surveyId;
                }
                return 0;
            });
    }

    createProfileSurveyIdTx(surveyId, transaction) {
        const ProfileSurvey = this.db.ProfileSurvey;
        return ProfileSurvey.destroy({ where: {}, transaction })
            .then(() => ProfileSurvey.create({ surveyId }, { transaction }));
    }

    createProfileSurveyId(surveyId) {
        return this.transaction(transaction => this.createProfileSurveyIdTx(surveyId, transaction));
    }

    deleteProfileSurveyId() {
        return this.db.ProfileSurvey.destroy({ where: {} });
    }

    createProfileSurvey(survey) {
        return this.transaction(transaction => this.survey.createOrReplaceSurvey(survey)
                .then(surveyId => this.createProfileSurveyIdTx(surveyId, transaction)
                        .then(() => ({ id: surveyId }))));
    }

    getProfileSurvey(options = {}) {
        return this.getProfileSurveyId()
            .then((profileSurveyId) => {
                if (profileSurveyId) {
                    return this.survey.getSurvey(profileSurveyId, options)
                        .then((survey) => {
                            const surveyId = survey.id;
                            const action = 'create';
                            return this.db.SurveyConsent.findAll({
                                where: { surveyId, action },
                                raw: true,
                                attributes: ['consentTypeId'],
                            })
                                .then(rawTypeIds => _.map(rawTypeIds, 'consentTypeId'))
                                .then((typeIds) => {
                                    if (typeIds.length) {
                                        return this.consentDocument.listConsentDocuments({ summary: true, typeIds }) // eslint-disable-line max-len
                                            .then((consentDocuments) => {
                                                survey.consentDocuments = consentDocuments; // eslint-disable-line no-param-reassign, max-len
                                            });
                                    }
                                    return null;
                                })
                                .then(() => ({ exists: true, survey }));
                        });
                }
                return { exists: false };
            });
    }
};
