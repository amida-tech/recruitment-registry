/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const surveyHelper = require('../helper/survey-helper');
const models = require('../../models');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');
const shared = require('../shared-spec.js');
const RRError = require('../../lib/rr-error');

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

    it('error: create survey without questions', function () {
        return Survey.createSurvey({ name: 'name', released: false })
            .then(() => { throw new Error('unexpected no error'); })
            .catch(err => {
                expect(err).to.be.instanceof(RRError);
                expect(err.code).to.equal('surveyNoQuestions');
                expect(!!err.message).to.equal(true);
            });
    });

    for (let i = 0; i < 8; ++i) {
        it(`create/verify/update survey ${i} and list all`, createVerifySurveyFn(i));
    }

    it('error: show a non existant survey', function () {
        return Survey.getSurveyById(999)
            .then(() => { throw new Error('unexpected no error'); })
            .catch(err => {
                expect(err).to.be.instanceof(RRError);
                expect(err.code).to.equal('surveyNotFound');
                expect(!!err.message).to.equal(true);
            });
    });

    it('error: release an already released survey', function () {
        const releasedSurvey = store.surveys[1];
        expect(releasedSurvey.released).to.equal(true);
        return Survey.releaseSurvey(releasedSurvey.id)
            .then(() => { throw new Error('unexpected no error'); })
            .catch(err => {
                expect(err).to.be.instanceof(RRError);
                expect(err.code).to.equal('surveyAlreadyReleased');
                expect(!!err.message).to.equal(true);
            });
    });

    it('error: release a non existant survey', function () {
        return Survey.releaseSurvey(999)
            .then(() => { throw new Error('unexpected no error'); })
            .catch(err => {
                expect(err).to.be.instanceof(RRError);
                expect(err.code).to.equal('surveyNotFound');
                expect(!!err.message).to.equal(true);
            });
    });

    it('release a survey', function () {
        const survey = store.surveys[4];
        expect(survey.released).to.equal(false);
        return Survey.releaseSurvey(survey.id)
            .then((empty) => {
                expect(empty).to.deep.equal({});
                return Survey.getSurveyById(survey.id);
            })
            .then((actual) => {
                survey.released = true;
                expect(actual).to.deep.equal(survey);
            });
    });

    it('error: version a not released survey', function () {
        const survey = store.surveys[5];
        expect(survey.released).to.equal(false);
        const replacementSurvey = shared.genNewSurvey({ released: false });
        return Survey.versionSurvey({
                id: survey.id,
                replacement: replacementSurvey
            })
            .then(() => { throw new Error('unexpected no error'); })
            .catch(err => {
                expect(err).to.be.instanceof(RRError);
                expect(err.code).to.equal('surveyVersionAlreadyDraft');
                expect(!!err.message).to.equal(true);
            });
    });

    it('error: version with a survey with no questions', function () {
        const survey = store.surveys[1];
        expect(survey.released).to.equal(true);
        const replacementSurvey = shared.genNewSurvey({ released: false, addQuestions: false });
        return Survey.versionSurvey({
                id: survey.id,
                replacement: replacementSurvey
            })
            .then(() => { throw new Error('unexpected no error'); })
            .catch(err => {
                expect(err).to.be.instanceof(RRError);
                expect(err.code).to.equal('surveyNoQuestions');
                expect(!!err.message).to.equal(true);
            });
    });

    it('version a draft survey and release', function () {
        const index = 1;
        const survey = store.surveys[index];
        expect(survey.released).to.equal(true);
        const inputSurvey = shared.genNewSurvey({ released: false });
        store.inputSurveys.push(inputSurvey);
        return Survey.versionSurvey({
                id: survey.id,
                replacement: inputSurvey
            })
            .then(id => Survey.getSurveyById(id))
            .then((serverSurvey) => {
                return surveyHelper.buildServerSurvey(inputSurvey, serverSurvey)
                    .then(expected => {
                        expect(serverSurvey).to.deep.equal(expected);
                        store.surveys.push(serverSurvey);
                        return serverSurvey.id;
                    });
            })
            .then(() => Survey.listSurveys())
            .then(surveys => {
                expect(surveys).to.have.length(store.surveys.length);
                const expected = store.surveys.map(({ id, name, released }) => ({ id, name, released }));
                expect(surveys).to.deep.equal(expected);
            })
            .then(() => {
                const newSurvey = store.surveys[store.surveys.length - 1];
                return Survey.releaseSurvey(newSurvey.id)
                    .then(() => newSurvey.released = true);
            })
            .then(() => Survey.listSurveys())
            .then((surveys) => {
                store.inputSurveys.splice(index, 1);
                store.surveys.splice(index, 1);
                expect(surveys).to.have.length(store.surveys.length);
                const expected = store.surveys.map(({ id, name, released }) => ({ id, name, released }));
                expect(surveys).to.deep.equal(expected);
            });

    });

    const versionReleasedSurveyFn = function (index) {
        return function () {
            if (index === undefined) {
                index = store.surveys.length - 1;
            }
            const survey = store.surveys[index];
            expect(survey.released).to.equal(true);
            const inputSurvey = shared.genNewSurvey({ released: true });
            store.inputSurveys.push(inputSurvey);
            store.inputSurveys.splice(index, 1);
            return Survey.versionSurvey({
                    id: survey.id,
                    replacement: inputSurvey
                })
                .then(id => Survey.getSurveyById(id))
                .then((serverSurvey) => {
                    return surveyHelper.buildServerSurvey(inputSurvey, serverSurvey)
                        .then(expected => {
                            expect(serverSurvey).to.deep.equal(expected);
                            store.surveys.push(serverSurvey);
                            store.surveys.splice(index, 1);
                            return serverSurvey.id;
                        });
                })
                .then(() => Survey.listSurveys())
                .then(surveys => {
                    expect(surveys).to.have.length(store.surveys.length);
                    const expected = store.surveys.map(({ id, name, released }) => ({ id, name, released }));
                    expect(surveys).to.deep.equal(expected);
                });
        };
    };

    const dbVersionCompare = function (index, count) {
        const survey = store.surveys[index];
        return Survey.findById(survey.id)
            .then(fullSurvey => {
                const groupId = fullSurvey.groupId;
                return Survey.findAll({
                        where: { groupId },
                        paranoid: false,
                        attributes: ['groupId', 'version'],
                        raw: true
                    })
                    .then(actual => {
                        actual = _.sortBy(actual, 'version');
                        const expected = _.range(1, count + 1).map(version => ({ version, groupId }));
                        expect(actual).to.deep.equal(expected);
                    });
            });
    };

    it('version a released survey', function () {
        return versionReleasedSurveyFn(3)()
            .then(versionReleasedSurveyFn(0))
            .then(versionReleasedSurveyFn(store.surveys.length - 1))
            .then(() => dbVersionCompare(store.surveys.length - 1, 3))
            .then(() => dbVersionCompare(store.surveys.length - 2, 2));
    });

    it('version a draft survey and delete', function () {
        const inputSurvey = shared.genNewSurvey({ released: true });
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
            .then((id) => {
                const replacement = shared.genNewSurvey({ released: false });
                return Survey.versionSurvey({ id, replacement });
            })
            .then(id => Survey.deleteSurvey(id))
            .then(() => Survey.listSurveys())
            .then(surveys => {
                const expected = store.surveys.map(({ id, name, released }) => ({ id, name, released }));
                expect(surveys).to.deep.equal(expected);
            })
            .then(versionReleasedSurveyFn())
            .then(() => {
                const survey = store.surveys[store.surveys.length - 1];
                return Survey.findById(survey.id)
                    .then(fullSurvey => {
                        const groupId = fullSurvey.groupId;
                        return Survey.findAll({
                                where: { groupId },
                                paranoid: false,
                                attributes: ['groupId', 'version'],
                                raw: true
                            })
                            .then(actual => {
                                actual = _.sortBy(actual, 'version');
                                const expected = [1, 2, 2].map(version => ({ version, groupId }));
                                expect(actual).to.deep.equal(expected);
                            });
                    });
            });
    });

    it('delete a survey', function () {
        const survey = store.surveys[5];
        store.surveys.splice(5, 1);
        store.inputSurveys.splice(5, 1);
        return Survey.deleteSurvey(survey.id)
            .then(() => Survey.listSurveys())
            .then(surveys => {
                const expected = store.surveys.map(({ id, name, released }) => ({ id, name, released }));
                expect(surveys).to.deep.equal(expected);
            });
    });

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
