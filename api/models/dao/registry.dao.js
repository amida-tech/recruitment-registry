'use strict';

const _ = require('lodash');

const db = require('../db');

const tokener = require('../../lib/tokener');
const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');

const sequelize = db.sequelize;
const Registry = db.Registry;
const User = db.User;
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
            .then(({ profileSurveyId }) => {
                if (!profileSurveyId) {
                    return RRError.reject('registryNoProfileSurvey');
                }
                return profileSurveyId;
            });
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
                .then(id => this.survey.updateSurveyTextTx({ id, name, sections }, language, tx));
        });
    }

    getProfileSurvey(options = {}) {
        return this.getProfileSurveyId()
            .then(profileSurveyId => {
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
                            });
                    });
            });
    }

    createProfile(input, language) {
        return sequelize.transaction(tx => {
            return this.getProfileSurveyId()
                .then(profileSurveyId => {
                    input.user.role = 'participant';
                    return User.create(input.user, { transaction: tx })
                        .then(user => {
                            if (input.signatures && input.signatures.length) {
                                return SPromise.all(input.signatures.map(consentDocumentId => {
                                        const userId = user.id;
                                        return this.consentSignature.createSignature({ userId, consentDocumentId, language }, tx);
                                    }))
                                    .then(() => user);
                            }
                            return user;
                        })
                        .then(user => {
                            const answerInput = {
                                userId: user.id,
                                surveyId: profileSurveyId,
                                answers: input.answers,
                                language
                            };
                            return this.answer.createAnswersTx(answerInput, tx)
                                .then(() => ({ token: tokener.createJWT(user) }));
                        });
                });
        });
    }

    updateProfile(id, input, language) {
        return this.getProfileSurveyId()
            .then(profileSurveyId => {
                return sequelize.transaction(tx => {
                    return this.user.updateUser(id, input.user, {
                            transaction: tx
                        })
                        .then(() => {
                            const answerInput = {
                                userId: id,
                                surveyId: profileSurveyId,
                                answers: input.answers,
                                language
                            };
                            return this.answer.createAnswersTx(answerInput, tx);
                        });
                });
            });
    }

    getProfile(input) {
        return this.getProfileSurveyId()
            .then(profileSurveyId => {
                return this.user.getUser(input.userId)
                    .then(user => {
                        return this.survey.getAnsweredSurvey(user.id, profileSurveyId)
                            .then(survey => {
                                return {
                                    user,
                                    survey
                                };
                            });
                    });
            });
    }
};
