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
            createProfile: function (input) {
                return sequelize.transaction(function (tx) {
                    input.user.role = 'participant';
                    return sequelize.models.user.create(input.user, { transaction: tx })
                        .then(function (user) {
                            const answerInput = {
                                userId: user.id,
                                surveyId: input.surveyId,
                                answers: input.answers
                            };
                            const answerModel = sequelize.models.answer;
                            return answerModel.createAnswersTx(answerInput, tx)
                                .then(() => ({ token: tokener.createJWT(user) }));
                        });
                });
            },
            updateProfile: function (id, input) {
                return sequelize.transaction(function (tx) {
                    return sequelize.models.user.updateUser(id, input.user, {
                        transaction: tx
                    }).then(function () {
                        const answerInput = {
                            userId: id,
                            surveyId: input.surveyId,
                            answers: input.answers
                        };
                        return sequelize.models.answer.updateAnswersTx(answerInput, tx);
                    });
                });
            },
            getProfile: function (input) {
                return sequelize.models.user.getUser(input.userId).then(function (user) {
                    return sequelize.models.survey.getAnsweredSurveyByName(user.id, input.surveyName).then(function (survey) {
                        return {
                            user,
                            survey
                        };
                    });
                });
            }
        }
    });

    return Registry;
};
