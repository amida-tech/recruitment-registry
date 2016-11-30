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

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('survey consent unit - consent type only', function () {
    const userCount = 4;

    const hxConsentDocument = new ConsentDocumentHistory(userCount);
    const hxSurvey = new SurveyHistory();

    const profileSurveyConsents = [];
    const profileResponses = [];

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
            return models.surveyConsent.createSurveyConsentType({ surveyId, consentTypeId, action })
                .then(({ id }) => profileSurveyConsents.push({ id, consentTypeId, action }));
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

    const formProfileResponse = function () {
        const profileSurvey = hxSurvey.server(0);
        const answers = generator.answerQuestions(profileSurvey.questions);
        const user = generator.newUser();
        profileResponses.push({ user, answers });
    };

    const createProfileWithoutSignaturesFn = function (index, signIndices, missingConsentDocumentIndices) {
        return function () {
            let signObj = {};
            if (signIndices) {
                const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
                signObj = Object.assign({}, profileResponses[index], { signatures });
            }
            const response = Object.assign({}, profileResponses[index], signObj);
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
            const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
            let signObj = Object.assign({}, profileResponses[index], { signatures });
            const response = Object.assign({}, profileResponses[index], signObj);
            return models.profile.createProfile(response)
                .then(({ id }) => hxConsentDocument.hxUser.push(response.user, { id }))
                .then(() => models.userConsentDocument.listUserConsentDocuments(hxConsentDocument.userId(index)))
                .then(consentDocuments => expect(consentDocuments).to.have.length(2));
        };
    };

    const readProfileFn = function (index) {
        return function () {
            const userId = hxConsentDocument.userId(index);
            return models.profile.getProfile({ userId })
                .then(function (result) {
                    const pr = profileResponses[index];
                    const expectedUser = _.cloneDeep(pr.user);
                    const user = result.user;
                    expectedUser.id = user.id;
                    delete expectedUser.password;
                    expect(user).to.deep.equal(expectedUser);
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
        it(`form profile survey input for user ${i}`, formProfileResponse);
        it(`create user profile ${i} without signatures 0`, createProfileWithoutSignaturesFn(i, null, [0, 1]));
        it(`create user profile ${i} without signatures 1`, createProfileWithoutSignaturesFn(i, [], [0, 1]));
        it(`create user profile ${i} without signatures 2`, createProfileWithoutSignaturesFn(i, [0], [1]));
        it(`create user profile ${i} without signatures 3`, createProfileWithoutSignaturesFn(i, [1], [0]));
        it(`create user profile ${i} with signatures`, createProfileFn(i, [0, 1]));
        it(`read user profile ${i} with signatures`, readProfileFn(i));
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

    it(`read user profile 0 with signatures`, readProfileFn(0));
    it('read user profile 1 without signatures', readProfileWithoutSignaturesFn(1, [0, 1]));
    it('read user profile 2 without signatures', readProfileWithoutSignaturesFn(2, [1]));
    it('read user profile 3 without signatures', readProfileWithoutSignaturesFn(3, [0]));

    const fnDelete = function (index) {
        return function () {
            const id = profileSurveyConsents[index].id;
            return models.surveyConsent.deleteSurveyConsentType(id);
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`delete survey consent type ${i}`, fnDelete(i));
    }
});
