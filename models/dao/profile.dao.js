'use strict';

const Base = require('./base');
const SPromise = require('../../lib/promise');

module.exports = class ProfileDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    createProfile(input, language) {
        return this.transaction(tx => this.profileSurvey.getProfileSurveyId()
            .then(profileSurveyId => this.user.createUser(input.user, tx)
                    .then((user) => {
                        if (input.signatures && input.signatures.length) {
                            return SPromise.all(input.signatures.map((consentDocumentId) => {
                                const userId = user.id;
                                const record = { userId, consentDocumentId, language };
                                return this.consentSignature.createSignature(record, tx);
                            }))
                                .then(() => user);
                        }
                        return user;
                    })
                    .then((user) => {
                        if (profileSurveyId) {
                            const answerInput = {
                                userId: user.id,
                                surveyId: profileSurveyId,
                                answers: input.answers,
                                language,
                            };
                            return this.answer.createAnswersTx(answerInput, tx)
                                .then(() => user);
                        }
                        return user;
                    })));
    }

    updateProfile(id, input, language) {
        return this.profileSurvey.getProfileSurveyId()
            .then((profileSurveyId) => {
                if (profileSurveyId) {
                    return this.transaction(tx => this.user.updateUser(id, input.user, {
                        transaction: tx,
                    })
                            .then(() => {
                                const answerInput = {
                                    userId: id,
                                    surveyId: profileSurveyId,
                                    answers: input.answers,
                                    language,
                                };
                                return this.answer.createAnswersTx(answerInput, tx);
                            }));
                }
                return this.user.updateUser(id, input.user);
            });
    }

    getProfile(input) {
        return this.profileSurvey.getProfileSurveyId()
            .then(profileSurveyId => this.user.getUser(input.userId)
                    .then((user) => {
                        if (profileSurveyId) {
                            return this.survey.getAnsweredSurvey(user.id, profileSurveyId)
                                .then(survey => ({
                                    user,
                                    survey,
                                }));
                        }
                        return { user };
                    }));
    }
};
