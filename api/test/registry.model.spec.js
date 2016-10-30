/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const dao = require('../dao');
const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const tokener = require('../lib/tokener');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const translator = require('./util/translator');
const ConsentDocumentHistory = require('./util/consent-document-history');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('registry unit', function () {
    before(shared.setUpFn());

    const hxSurvey = new History(['id', 'name']);
    const hxUser = new History();
    const hxAnswers = [];
    const hxConsentDoc = new ConsentDocumentHistory(2);

    it('error: get profile survey when none created', function () {
        return dao.registry.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('registryNoProfileSurvey'));
    });

    const createProfileSurveyFn = function () {
        const clientSurvey = generator.newSurvey();
        return function () {
            return dao.registry.createProfileSurvey(clientSurvey)
                .then(idOnlyServer => hxSurvey.push(clientSurvey, idOnlyServer));
        };
    };

    const verifyProfileSurveyFn = function (index) {
        return function () {
            return dao.registry.getProfileSurvey()
                .then(server => {
                    const id = hxSurvey.id(index);
                    expect(server.id).to.equal(id);
                    hxSurvey.updateServer(index, server);
                    return comparator.survey(hxSurvey.client(index), server);
                });
        };
    };

    const translateProfileSurveyFn = function (index, language) {
        return function () {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            delete translation.id;
            return dao.registry.updateProfileSurveyText(translation, language)
                .then(() => {
                    hxSurvey.translate(index, language, translation);
                });
        };
    };

    const verifyTranslatedProfileSurveyFn = function (index, language) {
        return function () {
            return dao.registry.getProfileSurvey({ language })
                .then(result => {
                    translator.isSurveyTranslated(result, language);
                    const expected = hxSurvey.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    it('create profile survey 0', createProfileSurveyFn());
    it('get/verify profile survey 0', verifyProfileSurveyFn(0));

    it('check soft sync does not reset registry', function () {
        return models.sequelize.sync({ force: false });
    });
    it('get/verify profile survey 0', verifyProfileSurveyFn(0));

    it('get profile survey 0 in spanish when no translation', function () {
        return dao.registry.getProfileSurvey({ language: 'es' })
            .then(result => {
                const survey = hxSurvey.server(0);
                expect(result).to.deep.equal(survey);
            });
    });

    it('translate profile survey 0 to spanish', translateProfileSurveyFn(0, 'es'));
    it('get/verify translated profile survey 0 (spanish)', verifyTranslatedProfileSurveyFn(0, 'es'));

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
            const input = { user: clientUser, answers };
            if (signatures) {
                input.signatures = signatures.map(sign => hxConsentDoc.id(sign));
            }
            return dao.registry.createProfile(input)
                .then(({ token }) => tokener.verifyJWT(token))
                .then(({ id }) => hxUser.push(clientUser, { id }));
        };
    };

    const verifyProfileFn = function (surveyIndex, userIndex) {
        return function () {
            const survey = hxSurvey.server(surveyIndex);
            const userId = hxUser.id(userIndex);
            return dao.registry.getProfile({ userId })
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
            return dao.registry.updateProfile(userId, updateObj);
        };
    };

    const verifySignedDocumentFn = function (userIndex, expected) {
        return function () {
            const server = hxConsentDoc.server(0);
            const userId = hxUser.id(userIndex);
            return dao.consentDocument.getSignedConsentDocument(userId, server.id)
                .then(result => {
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal('en');
                    }
                });
        };
    };

    const verifySignedDocumentByTypeNameFn = function (userIndex, expected) {
        return function () {
            const server = hxConsentDoc.server(0);
            const typeName = hxConsentDoc.type(0).name;
            const userId = hxUser.id(userIndex);
            return dao.consentDocument.getSignedConsentDocumentByTypeName(userId, typeName)
                .then(result => {
                    expect(result.content).to.equal(server.content);
                    expect(result.signature).to.equal(expected);
                    if (expected) {
                        expect(result.language).to.equal('en');
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

    it('create profile survey 1', createProfileSurveyFn());
    it('get/verify profile survey 1', verifyProfileSurveyFn(1));
});
