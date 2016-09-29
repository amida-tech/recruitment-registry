'use strict';

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
                        return sequelize.models.survey.getSurveyById(profileSurveyId);
                    });
            },
            createProfile: function (input) {
                return sequelize.transaction(function (tx) {
                    return Registry.find({
                            where: { name: input.registryName },
                            raw: true,
                            attribues: ['id', 'profileSurveyId']
                        })
                        .then(({ id, profileSurveyId }) => {
                            input.user.role = 'participant';
                            input.user.registryId = id;
                            return sequelize.models.registry_user.create(input.user, { transaction: tx })
                                .then(function (user) {
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
                        .then(() => sequelize.models.registry_user.findById(id, {
                            raw: true,
                            attributes: ['registryId']
                        }, { transaction: tx }))
                        .then(({ registryId }) => sequelize.models.registry.findById(registryId, {
                            raw: true,
                            attributes: ['profileSurveyId']
                        }, { transaction: tx }))
                        .then(({ profileSurveyId }) => {
                            const answerInput = {
                                userId: id,
                                surveyId: profileSurveyId,
                                answers: input.answers
                            };
                            return sequelize.models.answer.updateAnswersTx(answerInput, tx);
                        });
                });
            },
            getProfile: function (input) {
                return sequelize.models.registry_user.getUser(input.userId)
                    .then(function (user) {
                        return sequelize.models.registry.findById(user.registryId, {
                                raw: true,
                                attributes: ['name']
                            })
                            .then(({ name }) => {
                                return sequelize.models.survey.getAnsweredSurveyByName(user.id, name)
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
