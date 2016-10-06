'use strict';

const _ = require('lodash');

const tokener = require('../lib/tokener');
const RRError = require('../lib/rr-error');

module.exports = function (sequelize, DataTypes) {
    const Answer = sequelize.import('./answer.model');
    const Survey = sequelize.import('./survey.model');
    const Document = sequelize.import('./document.model');
    const DocumentSignature = sequelize.import('./document-signature.model');
    const SurveyDocument = sequelize.import('./survey-document.model');

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
            createProfileSurvey: function (survey) {
                return sequelize.transaction(function (tx) {
                    return Survey.createSurveyTx(survey, tx)
                        .then(profileSurveyId => {
                            return Registry.update({ profileSurveyId }, { where: {}, transaction: tx })
                                .then(() => ({ id: profileSurveyId }));
                        });
                });
            },
            getProfileSurvey: function () {
                return Registry.findOne({
                        raw: true,
                        attributes: ['profileSurveyId']
                    })
                    .then(({ profileSurveyId }) => {
                        if (!profileSurveyId) {
                            return RRError.reject('registryNoProfileSurvey');
                        }
                        return Survey.getSurveyById(profileSurveyId)
                            .then(survey => {
                                const surveyId = survey.id;
                                const action = 'create';
                                return SurveyDocument.findAll({
                                        where: { surveyId, action },
                                        raw: true,
                                        attributes: ['documentTypeId']
                                    })
                                    .then(rawTypeIds => _.map(rawTypeIds, 'documentTypeId'))
                                    .then(typeIds => {
                                        if (typeIds.length) {
                                            return Document.listDocuments(typeIds)
                                                .then(documents => {
                                                    survey.documents = documents;
                                                    return survey;
                                                });
                                        } else {
                                            return survey;
                                        }
                                    });
                            });
                    });
            },
            createProfile: function (input) {
                return sequelize.transaction(function (tx) {
                    return Registry.findOne({
                            raw: true,
                            attribues: ['profileSurveyId']
                        })
                        .then(({ profileSurveyId }) => {
                            input.user.role = 'participant';
                            return sequelize.models.registry_user.create(input.user, { transaction: tx })
                                .then(user => {
                                    if (input.signatures && input.signatures.length) {
                                        return sequelize.Promise.all(input.signatures.map(documentId => {
                                                return DocumentSignature.createSignature(user.id, documentId, tx);
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
                return sequelize.transaction(function (tx) {
                    return sequelize.models.registry_user.updateUser(id, input.user, {
                            transaction: tx
                        })
                        .then(() => sequelize.models.registry.findOne({
                            raw: true,
                            attributes: ['profileSurveyId']
                        }, { transaction: tx }))
                        .then(({ profileSurveyId }) => {
                            const answerInput = {
                                userId: id,
                                surveyId: profileSurveyId,
                                answers: input.answers
                            };
                            return Answer.createAnswersTx(answerInput, tx);
                        });
                });
            },
            getProfile: function (input) {
                return sequelize.models.registry_user.getUser(input.userId)
                    .then(function (user) {
                        return sequelize.models.registry.findOne({
                                raw: true,
                                attributes: ['profileSurveyId']
                            })
                            .then(({ profileSurveyId }) => {
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
