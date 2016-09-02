/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');
var _ = require('lodash');

const helper = require('./survey-helper');
const db = require('../../db');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

var expect = chai.expect;

var Survey = db.Survey;
var Answer = db.Answer;
var User = db.User;

describe('survey unit', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;
    const answersSpec = surveyExamples.ExampleSpec;

    var userId;

    before(function () {
        return db.sequelize.sync({
            force: true
        }).then(function () {
            return User.create(user);
        }).then(function (result) {
            userId = result.id;
        });
    });

    var serverSurvey;

    it('post/get survey', function () {
        return Survey.post(example).then(function (id) {
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

        return Answer.post({
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
