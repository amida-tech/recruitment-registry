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

const Registry = models.Registry;
const ConsentDocument = models.ConsentDocument;

describe('registry unit', function () {
    before(shared.setUpFn());

    const hxSurvey = new History(['id', 'name']);
    const hxUser = new History();
    const hxAnswers = [];
    const hxConsentDoc = new ConsentDocumentHistory(2);

    it('error: get profile survey when none created', function () {
        return Registry.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('registryNoProfileSurvey'));
    });

    const createProfileSurveyFn = function () {
        const clientSurvey = generator.newSurvey();
        return function () {
            return Registry.createProfileSurvey(clientSurvey)
                .then(idOnlyServer => hxSurvey.push(clientSurvey, idOnlyServer));
        };
    };

    const verifyProfileSurveyFn = function (index) {
        return function () {
            return Registry.getProfileSurvey()
                .then(server => {
                    const id = hxSurvey.id(index);
                    expect(server.id).to.equal(id);
                    hxSurvey.updateServer(index, server);
                    return comparator.survey(hxSurvey.client(index), server);
                });
        };
    };

    it('create profile survey', createProfileSurveyFn());
    it('get/verify profile survey', verifyProfileSurveyFn(0));

    it('check soft sync does not reset registry', function () {
        return models.sequelize.sync({ force: false });
    });
    it('get/verify profile survey', verifyProfileSurveyFn(0));


    for (let i = 0; i < 2; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(hxConsentDoc));
    }

    for (let i = 0; i < 2; ++i) {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(hxConsentDoc, i));
    }

    const createProfileFn = function (surveyIndex, signatures) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const clientUser = generator.newUser();
            const answers = generator.answerQuestions(survey.questions);
            hxAnswers.push(answers);
            const input = {user: clientUser, answers};
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            return Registry.createProfile(input)
                .then(({ token }) => tokener.verifyJWT(token))
                .then(({ id }) => hxUser.push(clientUser, { id }));
        };
    };

    const verifyProfileFn = function (surveyIndex, userIndex) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const userId = hxUser.id(userIndex);
            return Registry.getProfile({ userId })
                .then(function (result) {
                    comparator.user(hxUser.client(userIndex), result.user);
                    comparator.answeredSurvey(survey, hxAnswers[userIndex], result.survey);
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
            return Registry.updateProfile(userId, updateObj);
        };
    };

    it('register user 0 with profile survey 0', createProfileFn(0));

    it('verify user 0 profile', verifyProfileFn(0, 0));

    it('verify document 0 is not signed by user 0', function() {
        const id = hxConsentDoc.id(0);
        const userId = hxUser.id(0);
        return ConsentDocument.getSignedConsentDocument(userId, id)
            .then(result => {
                expect(result.signature).to.equal(false);
            });
    });

    it('update user 0 profile', updateProfileFn(0, 0));

    it('verify user 0 profile', verifyProfileFn(0, 0));

    it('register user 1 with profile survey 0 and doc 0 signature', createProfileFn(0, [0]));

    it('verify user 1 profile', verifyProfileFn(0, 1));

    it('verify document 0 is signed by user 1', function() {
        const id = hxConsentDoc.id(0);
        const userId = hxUser.id(1);
        return ConsentDocument.getSignedConsentDocument(userId, id)
            .then(result => {
                expect(result.signature).to.equal(true);
                expect(result.language).to.equal('en');
            });
    });

    it('create profile survey', createProfileSurveyFn());
    it('get/verify profile survey', verifyProfileSurveyFn(1));
});
