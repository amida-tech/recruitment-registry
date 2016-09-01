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

        const q0 = serverSurvey.questions[0].id;
        const a00 = serverSurvey.questions[0].choices[1].id;
        const a01 = serverSurvey.questions[0].choices[2].id;

        const q1 = serverSurvey.questions[1].id;
        const a1 = serverSurvey.questions[1].choices[0].id;

        const q2 = serverSurvey.questions[2].id;
        const a2 = 'Washington, DC';

        const q3 = serverSurvey.questions[3].id;
        const a3 = true;

        const q4 = serverSurvey.questions[4].id;
        const a4 = false;

        var answers = [{
            questionId: q0,
            answer: [a00, a01]
        }, {
            questionId: q1,
            answer: a1
        }, {
            questionId: q2,
            answer: a2
        }, {
            questionId: q3,
            answer: a3
        }, {
            questionId: q4,
            answer: a4
        }];

        return Answer.post({
            userId,
            surveyId: id,
            answers
        }).then(function () {
            return Survey.getAnswered(userId, id);
        }).then(function (survey) {
            const expectedSurvey = _.cloneDeep(serverSurvey);
            expectedSurvey.questions.forEach(function (question, index) {
                question.answer = answers[index].answer;
            });
            expect(survey).to.deep.equal(expectedSurvey);
        });
    });
});
