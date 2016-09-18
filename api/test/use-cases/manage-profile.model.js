/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');
var _ = require('lodash');

const helper = require('../survey/survey-helper');
const models = require('../../models');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

var expect = chai.expect;

var Ethnicity = models.Ethnicity;
var User = models.User;
var Survey = models.Survey;

describe('user set up unit', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    before(function () {
        return models.sequelize.sync({
            force: true
        }).then(function () {
            return Survey.createSurvey(surveyExample.survey);
        });
    });

    var ethnicities;
    var genders;
    var survey;

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

    var userId;
    var answers;

    it('setup user with profile', function () {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);

        return User.register({
            user: userExample,
            surveyId: survey.id,
            answers
        }).then(function (id) {
            userId = id;
        });
    });

    it('verify user profile', function () {
        return User.showWithSurvey({
            userId,
            surveyName: surveyExample.survey.name
        }).then(function (result) {
            const expectedUser = _.cloneDeep(userExample);
            const user = result.user;
            expectedUser.id = user.id;
            expectedUser.password = user.password;
            delete user.createdAt;
            delete user.updatedAt;
            expect(user).to.deep.equal(expectedUser);

            const actualSurvey = result.survey;
            const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
            expect(actualSurvey).to.deep.equal(expectedSurvey);
        });
    });
});
