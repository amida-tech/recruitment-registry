/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const shared = require('../shared-spec.js');
const surveyHelper = require('../helper/survey-helper');
const tokener = require('../../lib/tokener');
const helper = require('../helper/survey-helper');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const expect = chai.expect;

const Registry = models.Registry;

const Ethnicity = models.Ethnicity;
const User = models.User;
const Survey = models.Survey;

describe('registry unit', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    before(shared.setUpFn());

    const store = {
        profileSurveyId: null
    };

    it('error: get profile survey when none created', function () {
        return Registry.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('registryNoProfileSurvey'));
    });

    const createProfileSurveyFn = function () {
        return function () {
            return Registry.createProfileSurvey(surveyExample.survey)
                .then(({ id }) => store.profileSurveyId = id);
        };
    };

    const verifyProfileSurveyFn = function () {
        return function () {
            return Registry.getProfileSurvey()
                .then(actual => {
                    return surveyHelper.buildServerSurvey(surveyExample.survey, actual)
                        .then(function (expected) {
                            expect(actual).to.deep.equal(expected);
                        });
                });
        };
    };

    it('create profile survey', createProfileSurveyFn());
    it('get/verify profile survey', verifyProfileSurveyFn());

    it('check soft sync does not reset registry', function () {
        return models.sequelize.sync({ force: false });
    });
    it('get/verify profile survey', verifyProfileSurveyFn());

    let ethnicities;
    let genders;
    let survey;

    it('load selection lists and survey', function () {
        return Ethnicity.findAll({
            raw: true
        }).then(function () {
            ethnicities = Ethnicity.ethnicities();
            genders = User.genders();
            return Survey.getSurveyByName(surveyExample.survey.name);
        }).then(function (result) {
            survey = result;
        });
    });

    let userId;
    let answers;

    it('setup user with profile', function () {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);
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
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            });
    });

    it('update user profile', function () {
        answers = helper.formAnswersToPost(survey, surveyExample.answerUpdate);
        const userUpdates = {
            zip: '20999',
            gender: 'other'
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
                expectedUser.zip = '20999';
                expectedUser.gender = 'other';
                delete expectedUser.password;
                delete user.createdAt;
                delete user.updatedAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            });
    });
});
