'use strict';

const _ = require('lodash');

const db = require('../db');

const sequelize = db.sequelize;
const ProfileSurvey = db.ProfileSurvey;
const SurveyConsentType = db.SurveyConsentType;

module.exports = class {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    getProfileSurveyId() {
        return ProfileSurvey.findOne({
                raw: true,
                attributes: ['surveyId']
            })
            .then(record => {
                if (record) {
                    return record.surveyId;
                } else {
                    return 0;
                }
            });
    }

    createProfileSurveyIdTx(surveyId, transaction) {
        return ProfileSurvey.destroy({where: {}, transaction })
            .then(() => ProfileSurvey.create({ surveyId }, { transaction }));
    }

    createProfileSurveyId(surveyId) {
        return sequelize.transaction(transaction => this.createProfileSurveyIdTx(surveyId, transaction));
    }

    deleteProfileSurveyId() {
        return ProfileSurvey.destroy({ where: {} });
    }

    createProfileSurvey(survey) {
        return sequelize.transaction(transaction => {
            return this.survey.createOrReplaceSurvey(survey)
                .then(surveyId => {
                    return this.createProfileSurveyIdTx(surveyId, transaction)
                        .then(() => ({ id: surveyId }));
                });
        });
    }

    getProfileSurvey(options = {}) {
        return this.getProfileSurveyId()
            .then(profileSurveyId => {
                if (profileSurveyId) {
                    return this.survey.getSurvey(profileSurveyId, options)
                        .then(survey => {
                            const surveyId = survey.id;
                            const action = 'create';
                            return SurveyConsentType.findAll({
                                    where: { surveyId, action },
                                    raw: true,
                                    attributes: ['consentTypeId']
                                })
                                .then(rawTypeIds => _.map(rawTypeIds, 'consentTypeId'))
                                .then(typeIds => {
                                    if (typeIds.length) {
                                        return this.consentDocument.listConsentDocuments({ summary: true, typeIds })
                                            .then(consentDocuments => {
                                                survey.consentDocument = consentDocuments;
                                                return survey;
                                            });
                                    } else {
                                        return survey;
                                    }
                                })
                                .then(survey => ({ exists: true, survey }));
                        });
                } else {
                    return { exists: false };
                }
            });
    }
};
