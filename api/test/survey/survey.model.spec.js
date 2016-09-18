/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const helper = require('./survey-helper');
const models = require('../../models');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const expect = chai.expect;

const Survey = models.Survey;
const Answer = models.Answer;
const User = models.User;

describe('survey unit', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;

    let userId;

    before(function () {
        return models.sequelize.sync({
            force: true
        }).then(function () {
            return User.create(user);
        }).then(function (result) {
            userId = result.id;
        });
    });

    let serverSurvey;

    it('post/get survey', function () {
        return Survey.createSurvey(example.survey).then(function (id) {
            return Survey.getSurveyById(id).then(function (result) {
                return helper.buildServerSurveyFromClientSurvey(example.survey, result).then(function (expected) {
                    expect(result).to.deep.equal(expected);
                    serverSurvey = result;
                });
            }).then(function () {
                return Survey.getSurveyByName(example.survey.name).then(function (result) {
                    return helper.buildServerSurveyFromClientSurvey(example.survey, result).then(function (expected) {
                        expect(result).to.deep.equal(expected);
                    });
                });
            });
        });
    });

    it('post answers, get survey with answers', function () {
        const id = serverSurvey.id;

        const answers = helper.formAnswersToPost(serverSurvey, example.answer);
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
