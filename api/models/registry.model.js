'use strict';

const _ = require('lodash');

const tokener = require('../lib/tokener');

module.exports = function (sequelize, DataTypes) {
    const Registry = sequelize.define('registry', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: {
                msg: 'The specified registry name is already in use.'
            },
        },
        profileSurveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'profile_survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deleted: 'deletedAt',
        paranoid: true,
        classMethods: {
            createRegistry: function ({ name, survey }) {
                return sequelize.transaction(function (tx) {
                    return sequelize.models.survey.createSurveyTx(survey, tx)
                        .then(profileSurveyId => Registry.create({ name, profileSurveyId }, { transaction: tx }))
                        .then(({ id }) => ({ id }));
                });
            },
            getRegistry: function (id) {
                return Registry.findById(id, {
                        raw: true,
                        attributes: ['id', 'name', 'profileSurveyId']
                    })
                    .then((registry) => {
                        if (!registry) {
                            return sequelize.Promise.reject(new Error('No such registry.'));
                        }
                        const { name, profileSurveyId } = registry;
                        return sequelize.models.survey.getSurveyById(profileSurveyId)
                            .then(survey => ({ name, survey }));
                    });
            },
            getRegistryByName: function (name) {
                return Registry.find({
                        where: { name },
                        raw: true,
                        attributes: ['id', 'name', 'profileSurveyId']
                    })
                    .then((registry) => {
                        if (!registry) {
                            return sequelize.Promise.reject(new Error('No such registry.'));
                        }
                        const { name, profileSurveyId } = registry;
                        return sequelize.models.survey.getSurveyById(profileSurveyId)
                            .then(survey => ({ name, survey }));
                    });
            },
            getRegistryProfileSurvey: function (name) {
                return Registry.find({
                        where: { name },
                        raw: true,
                        attributes: ['id', 'name', 'profileSurveyId']
                    })
                    .then((registry) => {
                        if (!registry) {
                            return sequelize.Promise.reject(new Error('No such registry.'));
                        }
                        const { profileSurveyId } = registry;
                        return sequelize.models.survey.getSurveyById(profileSurveyId)
                            .then(survey => {
                                const surveyId = survey.id;
                                const action = 'create';
                                return sequelize.models.survey_document.findAll({
                                        where: { surveyId, action },
                                        raw: true,
                                        attributes: ['documentTypeId']
                                    })
                                    .then(rawTypeIds => _.map(rawTypeIds, 'documentTypeId'))
                                    .then(typeIds => {
                                        if (typeIds.length) {
                                            return sequelize.models.document.listDocuments(typeIds)
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
                        .then(({ id, profileSurveyId }) => {
                            input.user.role = 'participant';
                            return sequelize.models.registry_user.create(input.user, { transaction: tx })
                                .then(user => {
                                    if (input.signatures && input.signatures.length) {
                                        return sequelize.Promise.all(input.signatures.map(documentId => {
                                                return sequelize.models.document_signature.createSignature(user.id, documentId, tx);
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
                                    const answerModel = sequelize.models.answer;
                                    return answerModel.createAnswersTx(answerInput, tx)
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
                            return sequelize.models.answer.createAnswersTx(answerInput, tx);
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
                                return sequelize.models.survey.getAnsweredSurveyById(user.id, profileSurveyId)
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
