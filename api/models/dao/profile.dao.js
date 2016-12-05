'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const sequelize = db.sequelize;

module.exports = class ProfileDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createProfile(input, language) {
        return sequelize.transaction(tx => {
            return this.profileSurvey.getProfileSurveyId()
                .then(profileSurveyId => {
                    input.user.role = 'participant';
                    return this.user.createUser(input.user, tx)
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
                            if (profileSurveyId) {
                                const answerInput = {
                                    userId: user.id,
                                    surveyId: profileSurveyId,
                                    answers: input.answers,
                                    language
                                };
                                return this.answer.createAnswersTx(answerInput, tx)
                                    .then(() => user);
                            }
                            return user;
                        });
                });
        });
    }

    updateProfile(id, input, language) {
        return this.profileSurvey.getProfileSurveyId()
            .then(profileSurveyId => {
                if (profileSurveyId) {
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
                } else {
                    return this.user.updateUser(id, input.user);
                }
            });
    }

    getProfile(input) {
        return this.profileSurvey.getProfileSurveyId()
            .then(profileSurveyId => {
                return this.user.getUser(input.userId)
                    .then(user => {
                        if (profileSurveyId) {
                            return this.survey.getAnsweredSurvey(user.id, profileSurveyId)
                                .then(survey => {
                                    return {
                                        user,
                                        survey
                                    };
                                });
                        } else {
                            return { user };
                        }
                    });
            });
    }
};
