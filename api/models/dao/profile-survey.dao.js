'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const Registry = db.Registry;
const SurveyConsentType = db.SurveyConsentType;

module.exports = class {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    getProfileSurveyId() {
        return Registry.findOne({
                raw: true,
                attributes: ['profileSurveyId']
            })
            .then(({ profileSurveyId }) => profileSurveyId ? profileSurveyId : null);
    }

    createProfileSurvey(survey) {
        return sequelize.transaction(tx => {
            return Registry.findOne()
                .then(registry => {
                    if (registry.profileSurveyId) {
                        const id = registry.profileSurveyId;
                        return this.survey.replaceSurveyTx(id, survey, tx)
                            .then(id => ({ id }));
                    } else {
                        return this.survey.createSurveyTx(survey, tx)
                            .then((id) => {
                                registry.profileSurveyId = id;
                                return registry.save({ transaction: tx })
                                    .then(() => ({ id }));
                            });
                    }
                });
        });
    }

    updateProfileSurveyText({ name, sections }, language) {
        return sequelize.transaction(tx => {
            return this.getProfileSurveyId()
                .then(id => {
                    if (id) {
                        return this.survey.updateSurveyTextTx({ id, name, sections }, language, tx);
                    } else {
                        return RRError.reject('registryNoProfileSurvey');
                    }
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
