'use strict';

const _ = require('lodash');

const tokener = require('../lib/tokener');
const RRError = require('../lib/rr-error');
const SPromise = require('../lib/promise');

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
            afterSync(options) {
                if (options.force) {
                    return Registry.create();
                }
            }
        },
        classMethods: {
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

            },
            createProfileSurvey(survey) {
                return sequelize.transaction(tx => {
                    return Registry.findOne()
                        .then(registry => {
                            if (registry.profileSurveyId) {
                                const id = registry.profileSurveyId;
                                return Survey.replaceSurveyTx(id, survey, tx)
                                    .then(id => ({ id }));
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
            updateProfileSurveyText({ name, sections }, language) {
                return sequelize.transaction(tx => {
                    return Registry.getProfileSurveyId()
                        .then(id => Survey.updateSurveyTextTx({ id, name, sections }, language, tx));
                });
            },
            getProfileSurvey(options = {}) {
                return Registry.getProfileSurveyId()
                    .then(profileSurveyId => {
                        return Survey.getSurvey(profileSurveyId, options)
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
                                            return ConsentDocument.listConsentDocuments({ summary: true, typeIds })
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
            createProfile(input, language) {
                return sequelize.transaction(tx => {
                    return Registry.getProfileSurveyId()
                        .then(profileSurveyId => {
                            input.user.role = 'participant';
                            return User.create(input.user, { transaction: tx })
                                .then(user => {
                                    if (input.signatures && input.signatures.length) {
                                        return SPromise.all(input.signatures.map(consentDocumentId => {
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
            updateProfile(id, input) {
                return Registry.getProfileSurveyId()
                    .then(profileSurveyId => {
                        return sequelize.transaction(tx => {
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
            getProfile(input) {
                return Registry.getProfileSurveyId()
                    .then(profileSurveyId => {
                        return User.getUser(input.userId)
                            .then(user => {
                                return Survey.getAnsweredSurvey(user.id, profileSurveyId)
                                    .then(survey => {
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
