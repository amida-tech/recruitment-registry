/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const surveyHelper = require('../helper/survey-helper');
const models = require('../../models');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');
const shared = require('../shared-spec.js');

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

    const store = {
        inputSurveys: [],
        surveys: []
    };

    it('verify no surveys', function () {
        return Survey.listSurveys()
            .then((surveys) => {
                expect(surveys).to.have.length(0);
            });
    });

    const createVerifySurveyFn = function (index) {
        return function () {
            const inputSurvey = shared.genNewSurvey({ released: index < 4 });
            store.inputSurveys.push(inputSurvey);
            return Survey.createSurvey(inputSurvey)
                .then(id => Survey.getSurveyById(id))
                .then((serverSurvey) => {
                    return surveyHelper.buildServerSurvey(inputSurvey, serverSurvey)
                        .then(expected => {
                            expect(serverSurvey).to.deep.equal(expected);
                            store.surveys.push(serverSurvey);
                            return serverSurvey.id;
                        });
                })
                .then((id) => Survey.updateSurvey(id, { name: inputSurvey.name + 'xyz' }))
                .then(() => Survey.getSurveyByName(inputSurvey.name + 'xyz'))
                .then(serverSurvey => {
                    const updatedSurvey = Object.assign({}, inputSurvey, { name: inputSurvey.name + 'xyz' });
                    return surveyHelper.buildServerSurvey(updatedSurvey, serverSurvey)
                        .then(expected => {
                            expect(serverSurvey).to.deep.equal(expected);
                            return serverSurvey.id;
                        });
                })
                .then((id) => Survey.updateSurvey(id, { name: inputSurvey.name }))
                .then(() => Survey.listSurveys())
                .then(surveys => {
                    expect(surveys).to.have.length(index + 1);
                    const expected = store.surveys.map(({ id, name, released }) => ({ id, name, released }));
                    expect(surveys).to.deep.equal(expected);
                });
        };
    };

    for (let i = 0; i < 6; ++i) {
        it(`create/verify/update survey ${i} and list all`, createVerifySurveyFn(i));
    }

    it('post/get survey', function () {
        return Survey.createSurvey(example.survey).then(function (id) {
            return Survey.getSurveyById(id).then(function (result) {
                    return surveyHelper.buildServerSurvey(example.survey, result)
                        .then(function (expected) {
                            expect(result).to.deep.equal(expected);
                            serverSurvey = result;
                        });
                })
                .then(function () {
                    return Survey.getSurveyByName(example.survey.name)
                        .then(function (result) {
                            return surveyHelper.buildServerSurvey(example.survey, result)
                                .then(function (expected) {
                                    expect(result).to.deep.equal(expected);
                                });
                        });
                });
        });
    });

    it('post answers, get survey with answers', function () {
        const id = serverSurvey.id;

        const answers = surveyHelper.formAnswersToPost(serverSurvey, example.answer);
        return Answer.createAnswers({
                userId,
                surveyId: id,
                answers
            })
            .then(function () {
                return Survey.getAnsweredSurveyById(userId, id);
            })
            .then(function (survey) {
                const expectedSurvey = surveyHelper.formAnsweredSurvey(serverSurvey, answers);
                expect(survey).to.deep.equal(expectedSurvey);
            });
    });
});
