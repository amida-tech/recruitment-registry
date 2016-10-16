'use strict';

const _ = require('lodash');

const tokener = require('../lib/tokener');
const RRError = require('../lib/rr-error');

module.exports = function (sequelize, DataTypes) {
    const User = sequelize.import('./user.model');
    const Answer = sequelize.import('./answer.model');
    const Survey = sequelize.import('./survey.model');
    const ConsentDocument = sequelize.import('./consent-document.model');
    const ConsentSignature = sequelize.import('./consent-signature.model');
    const SurveyConsentType = sequelize.import('./survey-consent-type.model');

    const Registry = sequelize.define('registry', {
        profileSurveyId: {
            type: DataTypes.INTEGER,
            field: 'profile_survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        }
    }, {
        freezeTableName: true,
        hooks: {
            afterSync: function (options) {
                if (options.force) {
                    return Registry.create();
                }
            }
        },
        classMethods: {
            getProfileSurveyId: function () {
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

            },
            createProfileSurvey: function (survey) {
                return sequelize.transaction(function (tx) {
                    return Registry.findOne()
                        .then(registry => {
                            if (registry.profileSurveyId) {
                                const id = registry.profileSurveyId;
                                return Survey.replaceSurvey(id, survey, tx);
                            } else {
                                return Survey.createSurveyTx(survey, tx)
                                    .then((id) => {
                                        registry.profileSurveyId = id;
                                        return registry.save({ transaction: tx })
                                            .then(() => ({ id }));
                                    });
                            }
                        });
                });
            },
            getProfileSurvey: function () {
                return Registry.getProfileSurveyId()
                    .then(profileSurveyId => {
                        return Survey.getSurvey(profileSurveyId)
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
                                            return ConsentDocument.listConsentDocuments(typeIds)
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
            },
            createProfile: function (input, language) {
                return sequelize.transaction(function (tx) {
                    return Registry.getProfileSurveyId()
                        .then(profileSurveyId => {
                            input.user.role = 'participant';
                            return User.create(input.user, { transaction: tx })
                                .then(user => {
                                    if (input.signatures && input.signatures.length) {
                                        return sequelize.Promise.all(input.signatures.map(consentDocumentId => {
                                                return ConsentSignature.createSignature(user.id, consentDocumentId, language, tx);
                                            }))
                                            .then(() => user);
                                    }
                                    return user;
                                })
                                .then(user => {
                                    const answerInput = {
                                        userId: user.id,
                                        surveyId: profileSurveyId,
                                        answers: input.answers
                                    };
                                    return Answer.createAnswersTx(answerInput, tx)
                                        .then(() => ({ token: tokener.createJWT(user) }));
                                });
                        });
                });
            },
            updateProfile: function (id, input) {
                return Registry.getProfileSurveyId()
                    .then(profileSurveyId => {
                        return sequelize.transaction(function (tx) {
                            return User.updateUser(id, input.user, {
                                    transaction: tx
                                })
                                .then(() => {
                                    const answerInput = {
                                        userId: id,
                                        surveyId: profileSurveyId,
                                        answers: input.answers
                                    };
                                    return Answer.createAnswersTx(answerInput, tx);
                                });
                        });
                    });
            },
            getProfile: function (input) {
                return Registry.getProfileSurveyId()
                    .then(profileSurveyId => {
                        return User.getUser(input.userId)
                            .then(function (user) {
                                return Survey.getAnsweredSurveyById(user.id, profileSurveyId)
                                    .then(function (survey) {
                                        return {
                                            user,
                                            survey
                                        };
                                    });
                            });
                    });
            }
        }
    });

    return Registry;
};
