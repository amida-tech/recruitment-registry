/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const models = require('../models');
const Generator = require('./util/generator');
const History = require('./util/history');
const consentCommon = require('./util/consent-common');
const ConsentDocumentHistory = require('./util/consent-document-history');
const SurveyHistory = require('./util/survey-history');
const MultiIndexHistory = require('./util/multi-index-history');
const comparator = require('./util/comparator');
const surveyCommon = require('./util/survey-common');
const answerCommon = require('./util/answer-common');
const consentTypeCommon = require('./util/consent-type-common');
const consentDocumentCommon = require('./util/consent-document-common');
const errSpec = require('./util/err-handler-spec');

describe('survey consent unit', function surveyConsentUnit() {
    const userCount = 4;
    const typeCount = 10;

    const expect = chai.expect;
    const generator = new Generator();
    const shared = new SharedSpec(generator);

    const hxConsentDocument = new ConsentDocumentHistory(userCount);
    const hxConsent = new History();
    const consentTests = new consentCommon.SpecTests({
        hxConsent, history: hxConsentDocument, generator,
    });
    const hxSurvey = new SurveyHistory();
    const hxUser = hxConsentDocument.hxUser;
    const hxSurveyConsents = new MultiIndexHistory();
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey);
    const answerTests = new answerCommon.SpecTests({ generator, hxUser, hxSurvey });
    const typeTests = new consentTypeCommon.SpecTests({
        generator, hxConsentType: hxConsentDocument.hxType,
    });
    const docTests = new consentDocumentCommon.SpecTests({
        generator, hxConsentDocument,
    });

    before(shared.setUpFn());

    _.range(typeCount).forEach((index) => {
        it(`create consent type ${index}`, typeTests.createConsentTypeFn());
    });

    [
        [4, 5, 6],
        [7, 8, 9],
    ].forEach((typeIndices, index) => {
        it(`create consent ${index}`, shared.createConsentFn(hxConsent, hxConsentDocument, typeIndices));
        it(`get/verify consent ${index}`, shared.verifyConsentFn(hxConsent, index));
    });

    it('create profile survey (survey 0)', shared.createProfileSurveyFn(hxSurvey));
    it('verify profile survey (survey 0)', shared.verifyProfileSurveyFn(hxSurvey, 0));

    _.range(1, 9).forEach((i) => {
        it(`create survey ${i}`, surveyTests.createSurveyFn({ noSection: true }));
        it(`verify survey ${i}`, surveyTests.getSurveyFn(i));
    });

    const surveysPerConsentType = _.range(typeCount).map(() => []);

    const createSurveyConsentFn = function (surveyIndex, typeIndex, action, consentIndex) {
        return function createSurveyConsent() {
            const consentType = hxConsentDocument.type(typeIndex);
            const consentTypeId = consentType.id;
            const surveyId = hxSurvey.id(surveyIndex);
            const surveyConsent = { surveyId, consentTypeId, action };
            if (consentIndex !== undefined) {
                const consentId = hxConsent.id(consentIndex);
                surveyConsent.consentId = consentId;
            }
            return models.surveyConsent.createSurveyConsent(surveyConsent)
                .then(({ id }) => {
                    surveyConsent.consentTypeName = consentType.name;
                    surveyConsent.consentTypeTitle = consentType.title;
                    if (consentIndex === undefined) {
                        hxSurveyConsents.pushWithId([surveyIndex, typeIndex, action], surveyConsent, id);
                    } else {
                        surveyConsent.consentName = hxConsent.client(consentIndex).name;
                        hxSurveyConsents.pushWithId([surveyIndex, typeIndex, action, consentIndex], surveyConsent, id);
                    }
                    if (surveysPerConsentType[typeIndex].find(r => (r === surveyIndex)) === undefined) {
                        surveysPerConsentType[typeIndex].push(surveyIndex);
                    }
                });
        };
    };

    _.range(typeCount).forEach((i) => {
        it(`create consent document of type ${i}`, docTests.createConsentDocumentFn(i));
    });

    const listConsentDocumentsSurveyFn = function () {
        return function listConsentDocumentsSurvey() {
            return models.consentDocument.listConsentDocuments({ summary: true, surveys: true, keepTypeId: true })
                .then((consentDocuments) => {
                    const types = _.range(10);
                    const expected = _.cloneDeep(hxConsentDocument.serversInList(types, { keepTypeId: true }));
                    expected.forEach((r, typeIndex) => {
                        const surveyIndices = surveysPerConsentType[typeIndex];
                        if (surveyIndices.length) {
                            r.surveys = surveyIndices.map((surveyIndex) => {
                                const { id, name } = hxSurvey.server(surveyIndex);
                                return { id, name };
                            });
                        }
                    });
                    comparator.consentDocuments(expected, consentDocuments);
                });
        };
    };

    it('list consent documents', docTests.listConsentDocumentsFn());
    it('list consent documents (manual expected indices)',
        docTests.listConsentDocumentsFn({ typeIndices: _.range(typeCount) }));

    it('list consent documents with surveys', listConsentDocumentsSurveyFn());

    [0, 1].forEach((index) => {
        it(`require consent type ${index} in profile survey answer create`, createSurveyConsentFn(0, index, 'create'));
        it(`require consent type ${index} in profile survey answer read`, createSurveyConsentFn(0, index, 'read'));
    });

    [1, 2, 3].forEach((index) => {
        it(`require consent type ${index} in survey 1 answer create`, createSurveyConsentFn(1, index, 'create'));
        it(`require consent type ${index} in survey 1 answer read`, createSurveyConsentFn(1, index, 'read'));
    });

    [2, 3].forEach((index) => {
        it(`require consent type ${index} in survey 2 answer create`, createSurveyConsentFn(2, index, 'create'));
        it(`require consent type ${index} in survey 2 answer read`, createSurveyConsentFn(2, index, 'read'));
    });

    [0, 2].forEach((index) => {
        it(`require consent type ${index} in survey 3 answer create`, createSurveyConsentFn(3, index, 'create'));
    });

    [1, 3].forEach((index) => {
        it(`require consent type ${index} in survey 3 answer read`, createSurveyConsentFn(3, index, 'read'));
    });

    it('list consent documents', docTests.listConsentDocumentsFn());
    it('list consent documents (manual expected indices)',
        docTests.listConsentDocumentsFn({ typeIndices: _.range(typeCount) }));

    it('list consent documents with surveys', listConsentDocumentsSurveyFn());

    it('error: require consent type with inconsistent consent', function errorConsistentType() {
        const consentTypeId = hxConsentDocument.typeId(0);
        const surveyId = hxSurvey.id(5);
        const consentId = hxConsent.id(0);
        const surveyConsent = { surveyId, consentId, consentTypeId, action: 'read' };
        return models.surveyConsent.createSurveyConsent(surveyConsent)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyConsentInvalidTypeForConsent'));
    });

    [4, 5, 6].forEach((index) => {
        it(`require consent type ${index} (consent 0) in survey 4 answer create`, createSurveyConsentFn(4, index, 'create', 0));
    });
    [7, 8, 9].forEach((index) => {
        it(`require consent type ${index} (consent 1) in survey 4 answer read`, createSurveyConsentFn(4, index, 'read', 1));
    });

    [4, 5, 6].forEach((index) => {
        it(`require consent type ${index} (consent 0) in survey 5 answer create`, createSurveyConsentFn(5, index, 'create', 0));
        it(`require consent type ${index} (consent 0) in survey 5 answer read`, createSurveyConsentFn(5, index, 'read', 0));
    });
    [7, 8, 9].forEach((index) => {
        it(`require consent type ${index} (consent 1) in survey 5 answer create`, createSurveyConsentFn(5, index, 'create', 1));
        it(`require consent type ${index} (consent 1) in survey 5 answer read`, createSurveyConsentFn(5, index, 'read', 1));
    });

    it('verify survey consents list', () => models.surveyConsent.listSurveyConsents()
            .then((result) => {
                const list = hxSurveyConsents.listServers();
                expect(result).to.deep.equal(list);
            }));

    it('get profile survey with required consentDocuments', () => models.profileSurvey.getProfileSurvey()
            .then((result) => {
                expect(result.exists).to.equal(true);
                const actual = result.survey;
                const id = hxSurvey.id(0);
                expect(actual.id).to.equal(id);
                const expected = hxConsentDocument.serversInList([0, 1]);
                comparator.consentDocuments(expected, actual.consentDocuments);
            }));

    const verifyConsentDocumentContentFn = function (typeIndex) {
        return function verifyConsentDocumentContent() {
            const cs = hxConsentDocument.server(typeIndex);
            return models.consentDocument.getConsentDocument(cs.id)
                .then((result) => {
                    expect(result).to.deep.equal(cs);
                });
        };
    };

    _.range(typeCount).forEach((i) => {
        it(`get/verify consent section of type ${i}`, verifyConsentDocumentContentFn(i));
    });

    const createProfileWithoutSignaturesFn = function (index, signIndices, documentIndices) {
        return function createProfileWithoutSignatures() {
            const profileSurvey = hxSurvey.server(0);
            const answers = generator.answerQuestions(profileSurvey.questions);
            const response = {
                user: generator.newUser(),
                answers,
            };
            if (signIndices) {
                const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
                Object.assign(response, { signatures });
            }
            return models.profile.createProfile(response)
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then((err) => {
                    const expected = hxConsentDocument.serversInList(documentIndices);
                    comparator.consentDocuments(expected, err.consentDocuments);
                });
        };
    };

    const createProfileFn = function (index, signIndices) {
        return function createProfile() {
            const profileSurvey = hxSurvey.server(0);
            const answers = generator.answerQuestions(profileSurvey.questions);
            const user = generator.newUser();
            const signatures = signIndices.map(signIndex => hxConsentDocument.id(signIndex));
            const response = { user, answers, signatures };
            return models.profile.createProfile(response)
                .then(({ id }) => hxUser.push(response.user, { id }))
                .then(() => models.userConsentDocument.listUserConsentDocuments(hxConsentDocument.userId(index)))
                .then(consentDocuments => expect(consentDocuments).to.have.length(8));
        };
    };

    const getProfileFn = function (index) {
        return function getProfile() {
            const userId = hxConsentDocument.userId(index);
            return models.profile.getProfile({ userId })
                .then((result) => {
                    comparator.user(hxUser.client(index), result.user);
                    hxUser.updateServer(index, result.user);
                });
        };
    };

    const verifyProfileFn = function (index) {
        return function verifyProfile() {
            const userId = hxConsentDocument.userId(index);
            return models.profile.getProfile({ userId })
                .then((result) => {
                    expect(result.user).to.deep.equal(hxUser.server(index));
                });
        };
    };

    const readProfileWithoutSignaturesFn = function (index, documentIndices) {
        return function readProfileWithoutSignatures() {
            const userId = hxConsentDocument.userId(index);
            return models.profile.getProfile({ userId })
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then((err) => {
                    const expected = hxConsentDocument.serversInList(documentIndices);
                    comparator.consentDocuments(expected, err.consentDocuments);
                });
        };
    };

    _.range(userCount).forEach((i) => {
        it(`create user profile ${i} without signatures 0`, createProfileWithoutSignaturesFn(i, null, [0, 1]));
        it(`create user profile ${i} without signatures 1`, createProfileWithoutSignaturesFn(i, [], [0, 1]));
        it(`create user profile ${i} without signatures 2`, createProfileWithoutSignaturesFn(i, [0], [1]));
        it(`create user profile ${i} without signatures 3`, createProfileWithoutSignaturesFn(i, [1], [0]));
        it(`create user profile ${i} with signatures`, createProfileFn(i, [0, 1]));
        it(`read user profile ${i} with signatures`, getProfileFn(i));
    });

    _.range(2).forEach((i) => {
        it(`create consent document of type ${i}`, docTests.createConsentDocumentFn(i));
    });

    _.range(userCount).forEach((i) => {
        it(`read user profile ${i} without signatures`, readProfileWithoutSignaturesFn(i, [0, 1]));
    });

    it('user 0 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 0, 0));
    it('user 0 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 0, 1));
    it('user 2 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 2, 0));
    it('user 3 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 3, 1));

    it('read user profile 0 with signatures', verifyProfileFn(0));
    it('error: read user profile 1 without signatures', readProfileWithoutSignaturesFn(1, [0, 1]));
    it('error: read user profile 2 without signatures', readProfileWithoutSignaturesFn(2, [1]));
    it('error: read user profile 3 without signatures', readProfileWithoutSignaturesFn(3, [0]));

    const answerSurveyWithoutSignaturesFn = function (userIndex, surveyIndex, expectedInfo) {
        return function answerSurveyWithoutSignatures() {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            return models.answer.createAnswers({ userId, surveyId: survey.id, answers })
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then((err) => {
                    const expected = consentTests.getSurveyConsentDocuments(expectedInfo);
                    comparator.consentDocuments(expected, err.consentDocuments);
                });
        };
    };

    const listConsentSurveyDocumentsFn = function (userIndex, surveyIndex, action, expectedInfo, detail) {
        return function listConsentSurveyDocuments() {
            const userId = hxUser.id(userIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            const options = {};
            if (detail) {
                options.detail = true;
            }
            return models.surveyConsentDocument.listSurveyConsentDocuments({ userId, surveyId, action }, options)
                .then((result) => {
                    const expected = _.cloneDeep(consentTests.getSurveyConsentDocuments(expectedInfo));
                    if (detail) {
                        const ids = expected.map(({ id }) => id);
                        const contents = hxConsentDocument.getContents(ids);
                        expected.forEach((r, index) => { r.content = contents[index]; });
                    }
                    comparator.consentDocuments(expected, result);
                });
        };
    };

    it('user 0 survey 1 consent documents for create', listConsentSurveyDocumentsFn(0, 1, 'create', [2, 3]));
    it('user 1 survey 1 consent documents for create', listConsentSurveyDocumentsFn(1, 1, 'create', [1, 2, 3]));
    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1, 2, 3]));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [2, 3]));

    it('user 0 survey 1 consent documents for create with content', listConsentSurveyDocumentsFn(0, 1, 'create', [2, 3], true));
    it('user 1 survey 1 consent documents for create with content', listConsentSurveyDocumentsFn(1, 1, 'create', [1, 2, 3], true));
    it('user 2 survey 1 consent documents for create with content', listConsentSurveyDocumentsFn(2, 1, 'create', [1, 2, 3], true));
    it('user 3 survey 1 consent documents for create with content', listConsentSurveyDocumentsFn(3, 1, 'create', [2, 3], true));

    it('user 0 survey 2 consent documents for create', listConsentSurveyDocumentsFn(0, 2, 'create', [2, 3]));
    it('user 1 survey 2 consent documents for create', listConsentSurveyDocumentsFn(1, 2, 'create', [2, 3]));
    it('user 2 survey 2 consent documents for create', listConsentSurveyDocumentsFn(2, 2, 'create', [2, 3]));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [2, 3]));

    it('user 0 survey 3 consent documents for create', listConsentSurveyDocumentsFn(0, 3, 'create', [2]));
    it('user 1 survey 3 consent documents for create', listConsentSurveyDocumentsFn(1, 3, 'create', [0, 2]));
    it('user 2 survey 3 consent documents for create', listConsentSurveyDocumentsFn(2, 3, 'create', [2]));
    it('user 3 survey 3 consent documents for create', listConsentSurveyDocumentsFn(3, 3, 'create', [0, 2]));

    it('error: create user 0 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(0, 1, [2, 3]));
    it('error: create user 1 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(1, 1, [1, 2, 3]));
    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1, 2, 3]));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [2, 3]));

    it('error: create user 0 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(0, 2, [2, 3]));
    it('error: create user 1 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(1, 2, [2, 3]));
    it('error: create user 2 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(2, 2, [2, 3]));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [2, 3]));

    it('error: create user 0 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(0, 3, [2]));
    it('error: create user 1 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(1, 3, [0, 2]));
    it('error: create user 2 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(2, 3, [2]));
    it('error: create user 3 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(3, 3, [0, 2]));

    it('user 0 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 0, 3));
    it('user 1 signs consent document 1', shared.signConsentTypeFn(hxConsentDocument, 1, 1));
    it('user 1 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 1, 3));
    it('user 2 signs consent document 3', shared.signConsentTypeFn(hxConsentDocument, 2, 3));

    it('user 0 survey 1 consent documents for create', listConsentSurveyDocumentsFn(0, 1, 'create', [2]));
    it('user 1 survey 1 consent documents for create', listConsentSurveyDocumentsFn(1, 1, 'create', [2]));
    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1, 2]));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [2, 3]));

    it('user 0 survey 2 consent documents for create', listConsentSurveyDocumentsFn(0, 2, 'create', [2]));
    it('user 1 survey 2 consent documents for create', listConsentSurveyDocumentsFn(1, 2, 'create', [2]));
    it('user 2 survey 2 consent documents for create', listConsentSurveyDocumentsFn(2, 2, 'create', [2]));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [2, 3]));

    it('user 0 survey 3 consent documents for create', listConsentSurveyDocumentsFn(0, 3, 'create', [2]));
    it('user 1 survey 3 consent documents for create', listConsentSurveyDocumentsFn(1, 3, 'create', [0, 2]));
    it('user 2 survey 3 consent documents for create', listConsentSurveyDocumentsFn(2, 3, 'create', [2]));
    it('user 3 survey 3 consent documents for create', listConsentSurveyDocumentsFn(3, 3, 'create', [0, 2]));

    it('error: create user 0 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(0, 1, [2]));
    it('error: create user 1 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(1, 1, [2]));
    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1, 2]));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [2, 3]));

    it('error: create user 0 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(0, 2, [2]));
    it('error: create user 1 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(1, 2, [2]));
    it('error: create user 2 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(2, 2, [2]));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [2, 3]));

    it('error: create user 0 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(0, 3, [2]));
    it('error: create user 1 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(1, 3, [0, 2]));
    it('error: create user 2 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(2, 3, [2]));
    it('error: create user 3 answers to survey 3 without signatures', answerSurveyWithoutSignaturesFn(3, 3, [0, 2]));

    _.range(4).forEach((index) => {
        it(`user ${index} signs consent document 2`, shared.signConsentTypeFn(hxConsentDocument, index, 2));
    });

    it('user 1 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 1, 0));
    it('user 3 signs consent document 0', shared.signConsentTypeFn(hxConsentDocument, 3, 0));

    it('user 2 survey 1 consent documents for create', listConsentSurveyDocumentsFn(2, 1, 'create', [1]));
    it('user 3 survey 1 consent documents for create', listConsentSurveyDocumentsFn(3, 1, 'create', [3]));
    it('user 3 survey 2 consent documents for create', listConsentSurveyDocumentsFn(3, 2, 'create', [3]));

    it('error: create user 2 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(2, 1, [1]));
    it('error: create user 3 answers to survey 1 without signatures', answerSurveyWithoutSignaturesFn(3, 1, [3]));
    it('error: create user 3 answers to survey 2 without signatures', answerSurveyWithoutSignaturesFn(3, 2, [3]));

    _.range(4).forEach((index) => {
        it(`user ${index} answers survey 3`, answerTests.answerSurveyFn(index, 3));
    });

    it('user 0 answers survey 1', answerTests.answerSurveyFn(0, 1));
    it('user 1 answers survey 1', answerTests.answerSurveyFn(1, 1));
    it('user 0 answers survey 2', answerTests.answerSurveyFn(0, 2));
    it('user 1 answers survey 2', answerTests.answerSurveyFn(1, 2));
    it('user 2 answers survey 2', answerTests.answerSurveyFn(2, 2));

    it('user 0 gets answered survey 1', answerTests.verifyAnsweredSurveyFn(0, 1));
    it('user 1 gets answered survey 1', answerTests.verifyAnsweredSurveyFn(1, 1));
    it('user 0 gets answered survey 2', answerTests.verifyAnsweredSurveyFn(0, 2));
    it('user 1 gets answered survey 2', answerTests.verifyAnsweredSurveyFn(1, 2));
    it('user 2 gets answered survey 2', answerTests.verifyAnsweredSurveyFn(2, 2));
    it('user 0 gets answered survey 3', answerTests.verifyAnsweredSurveyFn(0, 3));
    it('user 1 gets answered survey 3', answerTests.verifyAnsweredSurveyFn(1, 3));

    const getAnswersWithoutSignaturesFn = function (userIndex, surveyIndex, expectedInfo) {
        return function getAnswersWithoutSignatures() {
            const userId = hxUser.id(userIndex);
            const survey = hxSurvey.server(surveyIndex);
            return models.answer.getAnswers({ userId, surveyId: survey.id })
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then((err) => {
                    const expected = consentTests.getSurveyConsentDocuments(expectedInfo);
                    comparator.consentDocuments(expected, err.consentDocuments);
                });
        };
    };

    it('user 2 survey 3 consent documents for read', listConsentSurveyDocumentsFn(2, 3, 'read', [1]));
    it('user 3 survey 3 consent documents for read', listConsentSurveyDocumentsFn(3, 3, 'read', [3]));

    it('error: user 2 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(2, 3, [1]));
    it('error: user 3 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(3, 3, [3]));

    _.range(2).forEach((i) => {
        it(`create consent document of type ${i}`, docTests.createConsentDocumentFn(i));
    });

    it('user 0 survey 1 consent documents for read', listConsentSurveyDocumentsFn(0, 1, 'read', [1]));
    it('user 1 survey 1 consent documents for read', listConsentSurveyDocumentsFn(1, 1, 'read', [1]));
    it('user 2 survey 1 consent documents for read', listConsentSurveyDocumentsFn(2, 1, 'read', [1]));
    it('user 3 survey 1 consent documents for read', listConsentSurveyDocumentsFn(3, 1, 'read', [1, 3]));

    it('user 0 survey 3 consent documents for read', listConsentSurveyDocumentsFn(0, 3, 'read', [1]));
    it('user 1 survey 3 consent documents for read', listConsentSurveyDocumentsFn(1, 3, 'read', [1]));
    it('user 2 survey 3 consent documents for read', listConsentSurveyDocumentsFn(2, 3, 'read', [1]));
    it('user 3 survey 3 consent documents for read', listConsentSurveyDocumentsFn(3, 3, 'read', [1, 3]));

    it('error: user 0 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(0, 1, [1]));
    it('error: user 1 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(1, 1, [1]));
    it('error: user 2 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(2, 1, [1]));
    it('error: user 3 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(3, 1, [1, 3]));

    it('error: user 0 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(0, 3, [1]));
    it('error: user 1 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(1, 3, [1]));
    it('error: user 2 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(2, 3, [1]));
    it('error: user 3 gets answers to survey 3 without signatures', getAnswersWithoutSignaturesFn(3, 3, [1, 3]));

    const fnDelete = function (surveyIndex, typeIndex, action) {
        return function fn() {
            const id = hxSurveyConsents.id([surveyIndex, typeIndex, action]);
            return models.surveyConsent.deleteSurveyConsent(id);
        };
    };

    it('delete survey 1 consent type 1', fnDelete(1, 1, 'read'));

    it('user 3 survey 1 consent documents for read', listConsentSurveyDocumentsFn(3, 1, 'read', [3]));

    it('error: user 3 gets answers to survey 1 without signatures', getAnswersWithoutSignaturesFn(3, 1, [3]));

    it('delete survey 1 consent type 1', fnDelete(1, 1, 'create'));

    [0, 1, 2].forEach((index) => {
        it(`user ${index} answers survey 1`, answerTests.answerSurveyFn(index, 1));
        it(`user ${index} answered survey 1`, answerTests.verifyAnsweredSurveyFn(index, 1));
    });

    _.range(4).forEach((index) => {
        it(`user ${index} survey 4 consent documents for create`, listConsentSurveyDocumentsFn(index, 4, 'create', [
            [0, 4],
            [0, 5],
            [0, 6],
        ]));
        it(`user ${index} survey 5 consent documents for create`, listConsentSurveyDocumentsFn(index, 5, 'create', [
            [0, 4],
            [0, 5],
            [0, 6],
            [1, 7],
            [1, 8],
            [1, 9],
        ]));
    });

    _.range(4).forEach((index) => {
        it(`error: create user ${index} answers to survey 4 without signatures`, answerSurveyWithoutSignaturesFn(index, 4, [
            [0, 4],
            [0, 5],
            [0, 6],
        ]));
        it(`error: create user ${index} answers to survey 5 without signatures`, answerSurveyWithoutSignaturesFn(index, 5, [
            [0, 4],
            [0, 5],
            [0, 6],
            [1, 7],
            [1, 8],
            [1, 9],
        ]));
    });

    it('user 0 bulk signs consent documents 4, 5, 6', shared.bulkSignConsentTypeFn(hxConsentDocument, 0, [4, 5, 6]));
    it('user 1 bulk signs consent documents 4, 5, 6, 7, 8, 9', shared.bulkSignConsentTypeFn(hxConsentDocument, 1, [4, 5, 6, 7, 8, 9]));
    it('user 2 bulk signs consent documents 4, 6, 8', shared.bulkSignConsentTypeFn(hxConsentDocument, 2, [4, 6, 8]));
    it('user 3 bulk signs consent documents 5, 7, 9', shared.bulkSignConsentTypeFn(hxConsentDocument, 3, [5, 7, 9]));

    it('user 2 survey 4 consent documents for create', listConsentSurveyDocumentsFn(2, 4, 'create', [
        [0, 5],
    ]));
    it('user 3 survey 4 consent documents for create', listConsentSurveyDocumentsFn(3, 4, 'create', [
        [0, 4],
        [0, 6],
    ]));
    it('user 0 survey 5 consent documents for create', listConsentSurveyDocumentsFn(0, 5, 'create', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('user 2 survey 5 consent documents for create', listConsentSurveyDocumentsFn(2, 5, 'create', [
        [0, 5],
        [1, 7],
        [1, 9],
    ]));
    it('user 3 survey 5 consent documents for create', listConsentSurveyDocumentsFn(3, 5, 'create', [
        [0, 4],
        [0, 6],
        [1, 8],
    ]));

    it('error: create user 2 answers to survey 4 without signatures', answerSurveyWithoutSignaturesFn(2, 4, [
        [0, 5],
    ]));
    it('error: create user 3 answers to survey 4 without signatures', answerSurveyWithoutSignaturesFn(3, 4, [
        [0, 4],
        [0, 6],
    ]));
    it('error: create user 0 answers to survey 5 without signatures', answerSurveyWithoutSignaturesFn(0, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('error: create user 2 answers to survey 5 without signatures', answerSurveyWithoutSignaturesFn(2, 5, [
        [0, 5],
        [1, 7],
        [1, 9],
    ]));
    it('error: create user 3 answers to survey 5 without signatures', answerSurveyWithoutSignaturesFn(3, 5, [
        [0, 4],
        [0, 6],
        [1, 8],
    ]));

    it('user 0 answers survey 4', answerTests.answerSurveyFn(0, 4));
    it('user 1 answers survey 4', answerTests.answerSurveyFn(1, 4));
    it('user 1 answers survey 5', answerTests.answerSurveyFn(1, 5));

    it('user 1 gets answered survey 4', answerTests.verifyAnsweredSurveyFn(1, 4));
    it('user 1 gets answered survey 5', answerTests.verifyAnsweredSurveyFn(1, 5));

    it('user 0 survey 4 consent documents for read', listConsentSurveyDocumentsFn(0, 4, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));

    it('error: user 0 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(0, 4, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));

    it('user 0 bulk signs consent documents 7, 8, 9', shared.bulkSignConsentTypeFn(hxConsentDocument, 0, [7, 8, 9]));
    it('user 2 bulk signs consent documents 5, 7, 9', shared.bulkSignConsentTypeFn(hxConsentDocument, 2, [5, 7, 9]));
    it('user 3 bulk signs consent documents 4, 6, 8', shared.bulkSignConsentTypeFn(hxConsentDocument, 3, [4, 6, 8]));

    it('user 0 answers survey 5', answerTests.answerSurveyFn(0, 5));
    it('user 2 answers survey 5', answerTests.answerSurveyFn(2, 4));
    it('user 2 answers survey 5', answerTests.answerSurveyFn(2, 5));
    it('user 3 answers survey 5', answerTests.answerSurveyFn(3, 4));
    it('user 3 answers survey 5', answerTests.answerSurveyFn(3, 5));

    it('user 0 gets answered survey 4', answerTests.verifyAnsweredSurveyFn(0, 4));
    it('user 0 gets answered survey 5', answerTests.verifyAnsweredSurveyFn(0, 5));
    it('user 2 gets answered survey 4', answerTests.verifyAnsweredSurveyFn(2, 4));
    it('user 2 gets answered survey 5', answerTests.verifyAnsweredSurveyFn(2, 5));
    it('user 3 gets answered survey 4', answerTests.verifyAnsweredSurveyFn(3, 4));
    it('user 3 gets answered survey 5', answerTests.verifyAnsweredSurveyFn(3, 5));

    _.range(7, 10).forEach((i) => {
        it(`create consent document of type ${i}`, docTests.createConsentDocumentFn(i));
    });

    it('user 0 survey 4 consent documents for read', listConsentSurveyDocumentsFn(0, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('user 1 survey 4 consent documents for read', listConsentSurveyDocumentsFn(1, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('user 2 survey 4 consent documents for read', listConsentSurveyDocumentsFn(2, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('user 3 survey 4 consent documents for read', listConsentSurveyDocumentsFn(3, 5, 'read', [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));

    it('error: user 0 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(0, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('error: user 1 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(1, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('error: user 2 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(2, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));
    it('error: user 3 gets answers to survey 4 without signatures', getAnswersWithoutSignaturesFn(3, 5, [
        [1, 7],
        [1, 8],
        [1, 9],
    ]));

    const errorCreateSurveyRoleConsentFn = function (surveyIndex, typeIndex, action, consentIndex) {
        return function errorCreateSurveyConsent() {
            const consentType = hxConsentDocument.type(typeIndex);
            const consentTypeId = consentType.id;
            const surveyId = hxSurvey.id(surveyIndex);
            const surveyConsent = { surveyId, consentTypeId, action };
            if (consentIndex !== undefined) {
                const consentId = hxConsent.id(consentIndex);
                surveyConsent.consentId = consentId;
            }
            const errFn = errSpec.expectedErrorHandlerFn('surveyConsentNoRoleType');
            return models.surveyConsent.createSurveyConsent(surveyConsent)
                .then(errSpec.throwingHandler, errFn);
        };
    };

    _.range(typeCount, typeCount + 2).forEach((typeIndex, index) => {
        const role = typeIndex % 2 ? 'participant' : 'clinician';
        const options = { role };
        it(`create consent type ${typeIndex} role (${role})`,
            typeTests.createConsentTypeFn(options));
        const surveyIndex = 7 + index;
        it(`error: create survey consent with role  (${role}) type`,
            errorCreateSurveyRoleConsentFn(surveyIndex, typeIndex, 'read'));
    });
});
