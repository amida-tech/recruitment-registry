'use strict';

const db = require('../db');

const tokener = require('../../lib/tokener');
const SPromise = require('../../lib/promise');

const sequelize = db.sequelize;
const User = db.User;

module.exports = class {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createProfile(input, language) {
        return sequelize.transaction(tx => {
            return this.profileSurvey.getProfileSurveyId()
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
        return this.profileSurvey.getProfileSurveyId()
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
        return this.profileSurvey.getProfileSurveyId()
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
