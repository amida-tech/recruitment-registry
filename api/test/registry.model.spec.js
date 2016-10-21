/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const tokener = require('../lib/tokener');
const helper = require('./util/survey-common');
const comparator = require('./util/client-server-comparator');

const userExamples = require('./fixtures/example/user');
const surveyExamples = require('./fixtures/example/survey');

const expect = chai.expect;
const shared = new SharedSpec();

const Registry = models.Registry;

describe('registry unit', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    before(shared.setUpFn());

    const store = {
        profileSurveyId: null,
        clientSurveys: [],
        surveys: []
    };

    it('error: get profile survey when none created', function () {
        return Registry.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('registryNoProfileSurvey'));
    });

    const createProfileSurveyFn = function (survey) {
        return function () {
            store.clientSurveys.push(survey);
            return Registry.createProfileSurvey(survey)
                .then(({ id }) => store.profileSurveyId = id);
        };
    };

    const verifyProfileSurveyFn = function (index) {
        return function () {
            return Registry.getProfileSurvey()
                .then(actual => {
                    store.survey = actual;
                    store.surveys.push(actual);
                    return comparator.survey(store.clientSurveys[index], actual);
                });
        };
    };

    it('create profile survey', createProfileSurveyFn(surveyExample.survey));
    it('get/verify profile survey', verifyProfileSurveyFn(0));

    it('check soft sync does not reset registry', function () {
        return models.sequelize.sync({ force: false });
    });
    it('get/verify profile survey', verifyProfileSurveyFn(0));

    let userId;
    let answers;

    it('setup user with profile', function () {
        answers = helper.formAnswersToPost(store.survey, surveyExample.answer);
        return Registry.createProfile({
                user: userExample,
                answers
            })
            .then(({ token }) => tokener.verifyJWT(token))
            .then(({ id }) => userId = id);
    });

    it('verify user profile', function () {
        return Registry.getProfile({ userId })
            .then(function (result) {
                const expectedUser = _.cloneDeep(userExample);
                const user = result.user;
                expectedUser.id = user.id;
                delete expectedUser.password;
                delete user.createdAt;
                delete user.updatedAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(store.survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            });
    });

    it('update user profile', function () {
        answers = helper.formAnswersToPost(store.survey, surveyExample.answerUpdate);
        const userUpdates = {
            email: 'updated@example.com'
        };
        const updateObj = {
            user: userUpdates,
            answers
        };
        return Registry.updateProfile(userId, updateObj);
    });

    it('verify user profile', function () {
        return Registry.getProfile({ userId })
            .then(function (result) {
                const expectedUser = _.cloneDeep(userExample);
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.email = 'updated@example.com';
                delete expectedUser.password;
                delete user.createdAt;
                delete user.updatedAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(store.survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            });
    });

    const replacement = _.cloneDeep(surveyExamples.Example.survey);
    it('create profile survey', createProfileSurveyFn(replacement));
    it('get/verify profile survey', verifyProfileSurveyFn(1));
});
