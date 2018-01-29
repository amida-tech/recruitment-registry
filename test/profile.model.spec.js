/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const consentTypeCommon = require('./util/consent-type-common');
const consentDocumentCommon = require('./util/consent-document-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('profile unit', () => {
    before(shared.setUpFn());

    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const hxAnswers = [];
    const hxConsentDoc = new ConsentDocumentHistory(2);
    const typeTests = new consentTypeCommon.SpecTests({
        generator, hxConsentType: hxConsentDoc.hxType,
    });
    const docTests = new consentDocumentCommon.SpecTests({
        generator, hxConsentDocument: hxConsentDoc,
    });

    const createProfileFn = function () {
        return function createProfile() {
            const user = generator.newUser();
            const input = { user };
            return models.profile.createProfile(input)
                .then(({ id }) => hxUser.push(user, { id }))
                .then(() => hxAnswers.push(null));
        };
    };

    const verifyProfileFn = function (userIndex) {
        return function verifyProfile() {
            const userId = hxUser.id(userIndex);
            return models.profile.getProfile({ userId })
                .then((result) => {
                    comparator.user(hxUser.client(userIndex), result.user);
                });
        };
    };

    const updateProfileFn = function (userIndex) {
        return function updateProfile() {
            const userUpdates = {
                email: `updated${userIndex}@example.com`,
            };
            hxUser.client(userIndex).email = userUpdates.email;
            const updateObj = {
                user: userUpdates,
            };
            const userId = hxUser.id(userIndex);
            return models.profile.updateProfile(userId, updateObj);
        };
    };

    _.range(0, 2).forEach((index) => {
        it(`register user ${index}`, createProfileFn());
        it(`verify user ${index} profile`, verifyProfileFn(index));
        it(`update user ${index} profile`, updateProfileFn(index));
        it(`verify user ${index} profile`, verifyProfileFn(index));
    });

    it('create profile survey', shared.createProfileSurveyFn(hxSurvey));
    it('get/verify profile survey', shared.verifyProfileSurveyFn(hxSurvey, 0));

    _.range(2).forEach((i) => {
        it(`create consent type ${i}`, typeTests.createConsentTypeFn());
    });
    _.range(2).forEach((i) => {
        it(`create consent document of type ${i}`, docTests.createConsentDocumentFn(i));
    });

    const createProfileWithSurveyFn = function (surveyIndex, signatures, language) {
        return function createProfileWithSurvey() {
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = { user: clientUser, answers };
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            return models.profile.createProfile(input, language)
                .then(({ id }) => hxUser.push(clientUser, { id }));
        };
    };

    const verifyProfileWithSurveyFn = function (surveyIndex, userIndex, language) {
        return function verifyProfileWithSurvey() {
            const survey = hxSurvey.server(surveyIndex);
            const userId = hxUser.id(userIndex);
            return models.profile.getProfile({ userId })
                .then((result) => {
                    comparator.user(hxUser.client(userIndex), result.user);
                    comparator.answeredSurvey(survey, hxAnswers[userIndex], result.survey, language);
                });
        };
    };

    const updateProfileWithSurveyFn = function (surveyIndex, userIndex) {
        return function updateProfileWithSurvey() {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const userUpdates = {
                email: `updated${userIndex}@example.com`,
            };
            hxUser.client(userIndex).email = userUpdates.email;
            const updateObj = {
                user: userUpdates,
                answers,
            };
            const userId = hxUser.id(userIndex);
            hxAnswers[userIndex] = answers;
            return models.profile.updateProfile(userId, updateObj);
        };
    };

    const verifySignedDocumentFn = function (userIndex, expected, language) {
        language = language || 'en';
        return function verifySignedDocument() {
            const server = hxConsentDoc.server(0);
            const userId = hxUser.id(userIndex);
            return models.userConsentDocument.getUserConsentDocument(userId, server.id)
                .then((result) => {
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal(language);
                    }
                });
        };
    };

    const verifySignedDocumentByTypeNameFn = function (userIndex, expected, language) {
        language = language || 'en';
        return function verifySignedDocumentByTypeName() {
            const server = hxConsentDoc.server(0);
            const typeId = hxConsentDoc.type(0).id;
            const userId = hxUser.id(userIndex);
            return models.userConsentDocument.getUserConsentDocumentByTypeId(userId, typeId)
                .then((result) => {
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal(language);
                    }
                });
        };
    };

    _.range(2, 4).forEach((index) => {
        it(`register user ${index} with profile survey`, createProfileWithSurveyFn(0));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`verify document 1 is not signed by user ${index}`, verifySignedDocumentFn(index, false));
        it(`verify document 1 is not signed by user ${index} (type name)`, verifySignedDocumentByTypeNameFn(index, false));
        it(`update user ${index} profile`, updateProfileWithSurveyFn(0, index));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
    });

    _.range(4, 6).forEach((index) => {
        it(`register user ${index} with profile survey 0 and doc 0 signature`, createProfileWithSurveyFn(0, [0]));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index));
        it(`verify document 0 is signed by user ${index}`, verifySignedDocumentFn(index, true));
        it(`verify document 0 is signed by user ${index} (type name)`, verifySignedDocumentByTypeNameFn(index, true));
    });

    _.range(6, 8).forEach((index) => {
        it(`register user ${index} with profile survey 1 and doc 0 signature in spanish`, createProfileWithSurveyFn(0, [0], 'es'));
        it(`verify user ${index} profile`, verifyProfileWithSurveyFn(0, index, 'es'));
        it(`verify document 0 is signed by user ${index} in spanish`, verifySignedDocumentFn(index, true, 'es'));
        it(`verify document 0 is signed by user ${index} in spanish (type name)`, verifySignedDocumentByTypeNameFn(index, true, 'es'));
    });
});
