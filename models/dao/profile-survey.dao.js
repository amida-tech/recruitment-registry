'use strict';

const _ = require('lodash');

module.exports = class ProfileSurveyDAO {
    constructor(db, dependencies) {
        Object.assign(this, dependencies);
        this.db = db;
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
        const sequelize = this.db.sequelize;
        return sequelize.transaction(transaction => this.createProfileSurveyIdTx(surveyId, transaction));
    }

    deleteProfileSurveyId() {
        return this.db.ProfileSurvey.destroy({ where: {} });
    }

    createProfileSurvey(survey) {
        const sequelize = this.db.sequelize;
        return sequelize.transaction(transaction => this.survey.createOrReplaceSurvey(survey)
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
                                        return this.consentDocument.listConsentDocuments({ summary: true, typeIds })
                                            .then((consentDocuments) => {
                                                survey.consentDocuments = consentDocuments;
                                                return survey;
                                            });
                                    }
                                    return survey;
                                })
                                .then(survey => ({ exists: true, survey }));
                        });
                }
                return { exists: false };
            });
    }
};
