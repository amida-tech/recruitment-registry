/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const models = require('../models');
const Generator = require('./util/entity-generator');
const tokener = require('../lib/tokener');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

const ConsentSection = models.ConsentSection;
const Registry = models.Registry;
const SurveyConsentSection = models.SurveyConsentSection;
const ConsentSectionHistory = require('./util/consent-section-history');
const User = models.User;

describe('survey consent section unit', function () {
    const consentSectionTypeCount = 2;
    const userCount = 4;

    const history = new ConsentSectionHistory(userCount);

    let profileSurvey = null;
    const profileSurveyConsentSections = [];
    const profileResponses = [];

    before(shared.setUpFn());

    it('create registry', function () {
        const survey = generator.newSurvey();
        return Registry.createProfileSurvey(survey);
    });

    it('get registry profile survey, verify no required consentSections', function () {
        return Registry.getProfileSurvey()
            .then(survey => {
                expect(survey.id).to.be.above(0);
                expect(survey.consentSection).to.equal(undefined);
                profileSurvey = survey;
            });
    });

    for (let i = 0; i < consentSectionTypeCount; ++i) {
        it(`create consent section type ${i}`, shared.createConsentSectionTypeFn(history));
    }

    const createProfileSurveyConsentSectionFn = function (typeIndex, action) {
        return function () {
            const consentSectionTypeId = history.typeId(typeIndex);
            const surveyId = profileSurvey.id;
            return SurveyConsentSection.createSurveyConsentSectionType({ surveyId, consentSectionTypeId, action })
                .then(({ id }) => profileSurveyConsentSections.push({ id, consentSectionTypeId, action }));
        };
    };

    for (let i = 0; i < consentSectionTypeCount; ++i) {
        it(`require consent section type ${i} in survey question create`, createProfileSurveyConsentSectionFn(i, 'create'));
        it(`require consent section type ${i} in survey question read`, createProfileSurveyConsentSectionFn(i, 'read'));
    }

    it('error: get profile survey with no consentSections of existing types', function () {
        return Registry.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentSections'));
    });

    for (let i = 0; i < consentSectionTypeCount; ++i) {
        it(`create consent section of type ${i}`, shared.createConsentSectionFn(history, i));
    }

    it('get registry profile survey with required consentSections', function () {
        return Registry.getProfileSurvey()
            .then(actual => {
                expect(actual.id).to.equal(profileSurvey.id);
                const expected = history.serversInList([0, 1]);
                expect(actual.consentSection).to.deep.equal(expected);
            });
    });

    const verifyConsentSectionContentFn = function (typeIndex) {
        return function () {
            const cs = history.server(typeIndex);
            return ConsentSection.getConsentSection(cs.id)
                .then(result => {
                    expect(result).to.deep.equal(cs);
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`get/verify consent section of type ${i}`, verifyConsentSectionContentFn(i));
    }

    const formProfileResponse = function () {
        const answers = generator.answerQuestions(profileSurvey.questions);
        const user = generator.newUser();
        profileResponses.push({ user, answers });
    };

    const createProfileWithoutSignaturesFn = function (index, signIndices, missingConsentSectionIndices) {
        return function () {
            let signObj = {};
            if (signIndices) {
                const signatures = signIndices.map(signIndex => history.id(signIndex));
                signObj = Object.assign({}, profileResponses[index], { signatures });
            }
            const response = Object.assign({}, profileResponses[index], signObj);
            return Registry.createProfile(response)
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then(err => {
                    const expected = history.serversInList(missingConsentSectionIndices);
                    expect(err.consentSection).to.deep.equal(expected);
                });
        };
    };

    const createProfileFn = function (index, signIndices) {
        return function () {
            const signatures = signIndices.map(signIndex => history.id(signIndex));
            let signObj = Object.assign({}, profileResponses[index], { signatures });
            const response = Object.assign({}, profileResponses[index], signObj);
            return Registry.createProfile(response)
                .then(({ token }) => tokener.verifyJWT(token))
                .then(({ id }) => history.hxUser.push(response.user, { id }))
                .then(() => User.listConsentSections(history.userId(index)))
                .then(consentSections => expect(consentSections).to.have.length(0));
        };
    };

    const readProfileFn = function (index) {
        return function () {
            const userId = history.userId(index);
            return Registry.getProfile({ userId })
                .then(function (result) {
                    const pr = profileResponses[index];
                    const expectedUser = _.cloneDeep(pr.user);
                    const user = result.user;
                    expectedUser.id = user.id;
                    delete expectedUser.password;
                    delete user.zip;
                    delete user.ethnicity;
                    delete user.gender;
                    expect(user).to.deep.equal(expectedUser);
                });
        };
    };

    const readProfileWithoutSignaturesFn = function (index, missingConsentSectionIndices) {
        return function () {
            const userId = history.userId(index);
            return Registry.getProfile({ userId })
                .then(shared.throwingHandler, shared.expectedErrorHandler('profileSignaturesMissing'))
                .then(err => {
                    const expected = history.serversInList(missingConsentSectionIndices);
                    expect(err.consentSection).to.deep.equal(expected);
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`form profile survey input for user ${i}`, formProfileResponse);
        it(`create user profile ${i} without signatures 0`, createProfileWithoutSignaturesFn(i, null, [0, 1]));
        it(`create user profile ${i} without signatures 1`, createProfileWithoutSignaturesFn(i, [], [0, 1]));
        it(`create user profile ${i} without signatures 2`, createProfileWithoutSignaturesFn(i, [0], [1]));
        it(`create user profile ${i} without signatures 3`, createProfileWithoutSignaturesFn(i, [1], [0]));
        it(`create user profile ${i} with signatures`, createProfileFn(i, [0, 1]));
        it(`read user profile ${i} with signatures`, readProfileFn(i));
    }

    for (let i = 0; i < consentSectionTypeCount; ++i) {
        it(`create consent section of type ${i}`, shared.createConsentSectionFn(history, i));
    }

    for (let i = 0; i < 4; ++i) {
        it(`read user profile ${i} without signatures`, readProfileWithoutSignaturesFn(i, [0, 1]));
    }

    it('user 0 signs consent section 0', shared.signConsentSectionTypeFn(history, 0, 0));
    it('user 0 signs consent section 1', shared.signConsentSectionTypeFn(history, 0, 1));
    it('user 2 signs consent section 0', shared.signConsentSectionTypeFn(history, 2, 0));
    it('user 3 signs consent section 1', shared.signConsentSectionTypeFn(history, 3, 1));

    it(`read user profile 0 with signatures`, readProfileFn(0));
    it('read user profile 1 without signatures', readProfileWithoutSignaturesFn(1, [0, 1]));
    it('read user profile 2 without signatures', readProfileWithoutSignaturesFn(2, [1]));
    it('read user profile 3 without signatures', readProfileWithoutSignaturesFn(3, [0]));
});
