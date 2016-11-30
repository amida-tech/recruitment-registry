/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const models = require('../models');
const Generator = require('./util/entity-generator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const SurveyHistory = require('./util/survey-history');
const MultiIndexHistory = require('./util/multi-index-history');
const MultiIndexStore = require('./util/multi-index-store');
const comparator = require('./util/client-server-comparator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('survey consent unit - consent type only', function () {
    const userCount = 4;

    const hxConsentDocument = new ConsentDocumentHistory(userCount);
    const hxSurvey = new SurveyHistory();
    const hxUser = hxConsentDocument.hxUser;
    const hxSurveyConsents = new MultiIndexHistory();
    const hxAnswers = new MultiIndexStore();

    before(shared.setUpFn());

    for (let i = 0; i < 4; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(hxConsentDocument));
    }

    it('create profile survey (survey 0)', shared.createProfileSurveyFn(hxSurvey));
    it('verify profile survey (survey 0)', shared.verifyProfileSurveyFn(hxSurvey, 0));

    for (let i = 1; i < 4; ++i) {
        it(`create survey ${i}`, shared.createSurveyFn(hxSurvey));
        it(`verify survey ${i}`, shared.verifySurveyFn(hxSurvey, i));
    }

    const createSurveyConsentTypeFn = function (surveyIndex, typeIndex, action) {
        return function () {
            const consentTypeId = hxConsentDocument.typeId(typeIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            const surveyConsent = { surveyId, consentTypeId, action };
            return models.surveyConsent.createSurveyConsentType(surveyConsent)
                .then(({ id }) => hxSurveyConsents.pushWithId([surveyIndex, typeIndex, action], surveyConsent, id));
        };
    };

    [0, 1].forEach(index => {
        it(`require consent type ${index} in profile survey answer create`, createSurveyConsentTypeFn(0, index, 'create'));
        it(`require consent type ${index} in profile survey answer read`, createSurveyConsentTypeFn(0, index, 'read'));
    });

    [1, 2, 3].forEach(index => {
        it(`require consent type ${index} in survey 1 answer create`, createSurveyConsentTypeFn(1, index, 'create'));
        it(`require consent type ${index} in survey 1 answer read`, createSurveyConsentTypeFn(1, index, 'read'));
    });

    [2, 3].forEach(index => {
        it(`require consent type ${index} in survey 2 answer create`, createSurveyConsentTypeFn(2, index, 'create'));
        it(`require consent type ${index} in survey 2 answer read`, createSurveyConsentTypeFn(2, index, 'read'));
    });

    [0, 2].forEach(index => {
        it(`require consent type ${index} in survey 3 answer create`, createSurveyConsentTypeFn(3, index, 'create'));
    });

    [1, 3].forEach(index => {
        it(`require consent type ${index} in survey 3 answer read`, createSurveyConsentTypeFn(3, index, 'read'));
    });

    it('error: get profile survey with no consent documents of existing types', function () {
        return models.profileSurvey.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentDocuments'));
    });

    for (let i = 0; i < 4; ++i) {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(hxConsentDocument, i));
    }

    it('get profile survey with required consentDocuments', function () {
        return models.profileSurvey.getProfileSurvey()
            .then(result => {
                expect(result.exists).to.equal(true);
                const actual = result.survey;
                const id = hxSurvey.id(0);
                expect(actual.id).to.equal(id);
                const expected = hxConsentDocument.serversInList([0, 1]);
                expect(actual.consentDocument).to.deep.equal(expected);
            });
    });

    const verifyConsentDocumentContentFn = function (typeIndex) {
        return function () {
            const cs = hxConsentDocument.server(typeIndex);
            return models.consentDocument.getConsentDocument(cs.id)
                .then(result => {
                    expect(result).to.deep.equal(cs);
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`get/verify consent section of type ${i}`, verifyConsentDocumentContentFn(i));
    }

    const createProfileWithoutSignaturesFn = function (index, signIndices, missingConsentDocumentIndices) {
        return function () {
            const profileSurvey = hxSurvey.server(0);
            const answers = generator.answerQuestions(profileSurvey.questions);
            let response = {
                user: generator.newUser(),
                answers
            };
            if (signIndices) {
                const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
                Object.assign(response, { signatures });
            }
            return models.profile.createProfile(response)
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then(err => {
                    const expected = hxConsentDocument.serversInList(missingConsentDocumentIndices);
                    expect(err.consentDocument).to.deep.equal(expected);
                });
        };
    };

    const createProfileFn = function (index, signIndices) {
        return function () {
            const profileSurvey = hxSurvey.server(0);
            const answers = generator.answerQuestions(profileSurvey.questions);
            const user = generator.newUser();
            const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
            const response = { user, answers, signatures };
            return models.profile.createProfile(response)
                .then(({ id }) => hxUser.push(response.user, { id }))
                .then(() => models.userConsentDocument.listUserConsentDocuments(hxConsentDocument.userId(index)))
                .then(consentDocuments => expect(consentDocuments).to.have.length(2));
        };
    };

    const getProfileFn = function (index) {
        return function () {
            const userId = hxConsentDocument.userId(index);
            return models.profile.getProfile({ userId })
                .then(function (result) {
                    comparator.user(hxUser.client(index), result.user);
                });
        };
    };

    const readProfileWithoutSignaturesFn = function (index, missingConsentDocumentIndices) {
        return function () {
            const userId = hxConsentDocument.userId(index);
            return models.profile.getProfile({ userId })
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then(err => {
                    const expected = hxConsentDocument.serversInList(missingConsentDocumentIndices);
                    expect(err.consentDocument).to.deep.equal(expected);
                });
        };
    };

    for (let i = 0; i < userCount; ++i) {
        it(`create user profile ${i} without signatures 0`, createProfileWithoutSignaturesFn(i, null, [0, 1]));
        it(`create user profile ${i} without signatures 1`, createProfileWithoutSignaturesFn(i, [], [0, 1]));
        it(`create user profile ${i} without signatures 2`, createProfileWithoutSignaturesFn(i, [0], [1]));
        it(`create user profile ${i} without signatures 3`, createProfileWithoutSignaturesFn(i, [1], [0]));
        it(`create user profile ${i} with signatures`, createProfileFn(i, [0, 1]));
        it(`read user profile ${i} with signatures`, getProfileFn(i));
    }

    for (let i = 0; i < 2; ++i) {
        it(`create consent section of type ${i}`, shared.createConsentDocumentFn(hxConsentDocument, i));
    }

    for (let i = 0; i < userCount; ++i) {
        it(`read user profile ${i} without signatures`, readProfileWithoutSignaturesFn(i, [0, 1]));
    }

    it('user 0 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 0, 0));
    it('user 0 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 0, 1));
    it('user 2 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 2, 0));
    it('user 3 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 3, 1));

    it(`read user profile 0 with signatures`, getProfileFn(0));
    it('read user profile 1 without signatures', readProfileWithoutSignaturesFn(1, [0, 1]));
    it('read user profile 2 without signatures', readProfileWithoutSignaturesFn(2, [1]));
    it('read user profile 3 without signatures', readProfileWithoutSignaturesFn(3, [0]));

    const answerSurveyWithoutSignaturesFn = function (userIndex, surveyIndex, missingConsentDocumentIndices) {
        return function () {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            return models.answer.createAnswers({ userId, surveyId: survey.id, answers })
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then(err => {
                    const expected = hxConsentDocument.serversInList(missingConsentDocumentIndices);
                    expect(err.consentDocument).to.deep.equal(expected);
                });
        };
    };

    it('create user 0 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(0, 1, [2, 3]));
    it('create user 1 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(1, 1, [1, 2, 3]));
    it('create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1, 2, 3]));
    it('create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [2, 3]));

    it('create user 0 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(0, 2, [2, 3]));
    it('create user 1 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(1, 2, [2, 3]));
    it('create user 2 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(2, 2, [2, 3]));
    it('create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [2, 3]));

    it('create user 0 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(0, 3, [2]));
    it('create user 1 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(1, 3, [0, 2]));
    it('create user 2 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(2, 3, [2]));
    it('create user 3 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(3, 3, [0, 2]));

    it('user 0 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 0, 3));
    it('user 1 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 1, 1));
    it('user 1 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 1, 3));
    it('user 2 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 2, 3));

    it('create user 0 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(0, 1, [2]));
    it('create user 1 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(1, 1, [2]));
    it('create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1, 2]));
    it('create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [2, 3]));

    it('create user 0 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(0, 2, [2]));
    it('create user 1 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(1, 2, [2]));
    it('create user 2 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(2, 2, [2]));
    it('create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [2, 3]));

    it('create user 0 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(0, 3, [2]));
    it('create user 1 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(1, 3, [0, 2]));
    it('create user 2 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(2, 3, [2]));
    it('create user 3 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(3, 3, [0, 2]));

    _.range(4).forEach(index => {
        it(`user ${index} signs consent document 2`, shared.signConsentTypeFn(hxConsentDocument, index, 2));
    });

    it('user 1 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 1, 0));
    it('user 3 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 3, 0));

    it('create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1]));
    it('create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [3]));
    it('create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [3]));

    const answerSurveyFn = function (userIndex, surveyIndex, update) {
        return function () {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {userId, surveyId: survey.id, answers};
            return models.answer.createAnswers(input)
                .then(() => {
                    if (update) {
                        hxAnswers.update([userIndex, surveyIndex], answers);
                    } else {
                        hxAnswers.push([userIndex, surveyIndex], answers);
                    }
                });
        };
    };

    const verifyAnsweredSurveyFn = function (userIndex, surveyIndex) {
        return function () {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = hxAnswers.get([userIndex, surveyIndex]);
            return models.survey.getAnsweredSurvey(userId, survey.id)
                .then(answeredSurvey => {
                    comparator.answeredSurvey(survey, answers, answeredSurvey);
                });
        };
    };

    _.range(4).forEach(index => {
        it(`user ${index} answers survey 3`,answerSurveyFn(index, 3));
    });

    it('user 0 answers survey 1',  answerSurveyFn(0, 1));
    it('user 1 answers survey 1',  answerSurveyFn(1, 1));
    it('user 0 answers survey 2',  answerSurveyFn(0, 2));
    it('user 1 answers survey 2',  answerSurveyFn(1, 2));
    it('user 2 answers survey 2',  answerSurveyFn(2, 2));

    it('user 0 gets answered survey 1', verifyAnsweredSurveyFn(0, 1));
    it('user 1 gets answered survey 1', verifyAnsweredSurveyFn(1, 1));
    it('user 0 gets answered survey 2', verifyAnsweredSurveyFn(0, 2));
    it('user 1 gets answered survey 2', verifyAnsweredSurveyFn(1, 2));
    it('user 2 gets answered survey 2', verifyAnsweredSurveyFn(2, 2));
    it('user 0 gets answered survey 3', verifyAnsweredSurveyFn(0, 3));
    it('user 1 gets answered survey 3', verifyAnsweredSurveyFn(1, 3));

    const getAnswersWithoutSignaturesFn = function (userIndex, surveyIndex, missingConsentDocumentIndices) {
        return function () {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            return models.answer.getAnswers({ userId, surveyId: survey.id })
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then(err => {
                    const expected = hxConsentDocument.serversInList(missingConsentDocumentIndices);
                    expect(err.consentDocument).to.deep.equal(expected);
                });
        };
    };

    it('error: user 2 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(2, 3, [1]));
    it('error: user 3 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(3, 3, [3]));

    for (let i = 0; i < 2; ++i) {
        it(`create consent section of type ${i}`, shared.createConsentDocumentFn(hxConsentDocument, i));
    }

    it('error: user 0 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(0, 1, [1]));
    it('error: user 1 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(1, 1, [1]));
    it('error: user 2 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(2, 1, [1]));
    it('error: user 3 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(3, 1, [1, 3]));

    it('error: user 0 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(0, 3, [1]));
    it('error: user 1 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(1, 3, [1]));
    it('error: user 2 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(2, 3, [1]));
    it('error: user 3 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(3, 3, [1, 3]));

    const fnDelete = function (surveyIndex, typeIndex, action) {
        return function () {
            const id = hxSurveyConsents.id([surveyIndex, typeIndex, action]);
            return models.surveyConsent.deleteSurveyConsentType(id);
        };
    };

    it(`delete survey 1 consent type 1`, fnDelete(1, 1, 'read'));

    it('error: user 3 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(3, 1, [3]));

    it(`delete survey 1 consent type 1`, fnDelete(1, 1, 'create'));

    [0, 1, 2].forEach(index => {
        it(`user ${index} answers survey 1`,  answerSurveyFn(index, 1, true));
        it(`user ${index} answered survey 1`, verifyAnsweredSurveyFn(index, 1));
    });
});
