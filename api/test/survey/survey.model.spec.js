/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');
var _ = require('lodash');

const helper = require('./survey-helper');
const models = require('../../models');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

var expect = chai.expect;

var Survey = models.Survey;
var Answer = models.Answer;
var User = models.User;

describe('survey unit', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;
    const answersSpec = surveyExamples.ExampleSpec;

    var userId;

    before(function () {
        return models.sequelize.sync({
            force: true
        }).then(function () {
            return User.create(user);
        }).then(function (result) {
            userId = result.id;
        });
    });

    var serverSurvey;

    it('post/get survey', function () {
        return Survey.createSurvey(example).then(function (id) {
            return Survey.getSurveyById(id).then(function (result) {
                return helper.buildServerSurveyFromClientSurvey(example, result).then(function (expected) {
                    expect(result).to.deep.equal(expected);
                    serverSurvey = result;
                });
            }).then(function () {
                return Survey.getSurveyByName(example.name).then(function (result) {
                    return helper.buildServerSurveyFromClientSurvey(example, result).then(function (expected) {
                        expect(result).to.deep.equal(expected);
                    });
                });
            });
        });
    });

    it('post answers, get survey with answers', function () {
        const id = serverSurvey.id;

        const answers = helper.formAnswersToPost(serverSurvey, answersSpec);
        return Answer.createAnswers({
            userId,
            surveyId: id,
            answers
        }).then(function () {
            return Survey.getAnsweredSurveyById(userId, id);
        }).then(function (survey) {
            const expectedSurvey = helper.formAnsweredSurvey(serverSurvey, answers);
            expect(survey).to.deep.equal(expectedSurvey);
        });
    });
});
