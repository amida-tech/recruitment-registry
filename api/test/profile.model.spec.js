/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const tokener = require('../lib/tokener');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const ConsentDocumentHistory = require('./util/consent-document-history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('profile unit', function () {
    before(shared.setUpFn());

    const hxSurvey = new History(['id', 'name']);
    const hxUser = new History();
    const hxAnswers = [];
    const hxConsentDoc = new ConsentDocumentHistory(2);

    it('error: get profile survey when none created', function () {
        return models.profileSurvey.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('registryNoProfileSurvey'));
    });

    it('create profile survey', shared.createProfileSurveyFn(hxSurvey));

    it('get/verify profile survey', shared.verifyProfileSurveyFn(hxSurvey, 0));

    it('check soft sync does not reset registry', function () {
        return models.sequelize.sync({ force: false });
    });

    it('get/verify profile survey', shared.verifyProfileSurveyFn(hxSurvey, 0));

    for (let i = 0; i < 2; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(hxConsentDoc));
    }

    for (let i = 0; i < 2; ++i) {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(hxConsentDoc, i));
    }

    const createProfileFn = function (surveyIndex, signatures, language) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = { user: clientUser, answers };
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            return models.profile.createProfile(input, language)
                .then(({ token }) => tokener.verifyJWT(token))
                .then(({ id }) => hxUser.push(clientUser, { id }));
        };
    };

    const verifyProfileFn = function (surveyIndex, userIndex, language) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const userId = hxUser.id(userIndex);
            return models.profile.getProfile({ userId })
                .then(function (result) {
                    comparator.user(hxUser.client(userIndex), result.user);
                    comparator.answeredSurvey(survey, hxAnswers[userIndex], result.survey, language);
                });
        };
    };

    const updateProfileFn = function (surveyIndex, userIndex) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const userUpdates = {
                email: `updated${userIndex}@example.com`
            };
            hxUser.client(userIndex).email = userUpdates.email;
            const updateObj = {
                user: userUpdates,
                answers
            };
            const userId = hxUser.id(userIndex);
            hxAnswers[userIndex] = answers;
            return models.profile.updateProfile(userId, updateObj);
        };
    };

    const verifySignedDocumentFn = function (userIndex, expected, language) {
        language = language || 'en';
        return function () {
            const server = hxConsentDoc.server(0);
            const userId = hxUser.id(userIndex);
            return models.userConsentDocument.getUserConsentDocument(userId, server.id)
                .then(result => {
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
        return function () {
            const server = hxConsentDoc.server(0);
            const typeName = hxConsentDoc.type(0).name;
            const userId = hxUser.id(userIndex);
            return models.userConsentDocument.getUserConsentDocumentByTypeName(userId, typeName)
                .then(result => {
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal(language);
                    }
                });
        };
    };

    it('register user 0 with profile survey 0', createProfileFn(0));

    it('verify user 0 profile', verifyProfileFn(0, 0));

    it('verify document 0 is not signed by user 0', verifySignedDocumentFn(0, false));

    it('verify document 0 is not signed by user 0 (type name)', verifySignedDocumentByTypeNameFn(0, false));

    it('update user 0 profile', updateProfileFn(0, 0));

    it('verify user 0 profile', verifyProfileFn(0, 0));

    it('register user 1 with profile survey 0 and doc 0 signature', createProfileFn(0, [0]));

    it('verify user 1 profile', verifyProfileFn(0, 1));

    it('verify document 0 is signed by user 1', verifySignedDocumentFn(1, true));

    it('verify document 0 is signed by user 1 (type name)', verifySignedDocumentByTypeNameFn(1, true));

    it('register user 2 with profile survey 1 and doc 0 signature in spanish', createProfileFn(0, [0], 'es'));

    it('verify user 2 profile', verifyProfileFn(0, 2, 'es'));

    it('verify document 0 is signed by user in spanish', verifySignedDocumentFn(2, true, 'es'));

    it('verify document 0 is signed by user 2 (type name)', verifySignedDocumentByTypeNameFn(2, true, 'es'));
});
