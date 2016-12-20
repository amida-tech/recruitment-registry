'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const comparator = require('./client-server-comparator');

const expect = chai.expect;

const formAnswersToPost = function (survey, answersSpec) {
    const questions = survey.questions;
    const result = answersSpec.reduce(function (r, spec, index) {
        if (spec !== null) {
            const entry = {
                questionId: questions[index].id,
                answer: {}
            };
            if (spec.choices) {
                entry.answer.choices = spec.choices.map(function (cindex) {
                    const { id } = questions[index].choices[cindex.index];
                    const result = { id };
                    const numValues = ['textValue', 'monthValue', 'yearValue', 'dayValue', 'integerValue', 'boolValue'].reduce((r, p) => {
                        if (cindex.hasOwnProperty(p)) {
                            ++r;
                            result[p] = cindex[p];
                        }
                        return r;
                    }, 0);
                    if (!numValues) {
                        result.boolValue = true;
                    }
                    return result;
                });
            }
            if (spec.hasOwnProperty('choice')) {
                entry.answer.choice = questions[index].choices[spec.choice].id;
            }
            if (spec.hasOwnProperty('textValue')) {
                entry.answer.textValue = spec.textValue;
            }
            if (spec.hasOwnProperty('boolValue')) {
                entry.answer.boolValue = spec.boolValue;
            }
            r.push(entry);
        }
        return r;
    }, []);
    return result;
};

const formAnsweredSurvey = function (survey, answers) {
    const result = _.cloneDeep(survey);
    result.questions.forEach(function (question, index) {
        question.answer = answers[index].answer;
        question.language = answers.language || 'en';
    });
    return result;
};

const updateIds = function (surveys, idMap, questionIdMap) {
    return surveys.map(survey => {
        const surveyId = idMap[survey.id];
        if (!surveyId) {
            throw new Error(`updateIds: id for '${survey.name}' does not exist in the map`);
        }
        survey.id = surveyId;
        survey.questions.forEach(question => {
            const questionIdObj = questionIdMap[question.id];
            if (!questionIdObj) {
                throw new Error(`updateIds: choice id does not exist for for '${survey.name}' in '${question.id}'`);
            }
            question.id = questionIdObj.questionId;
        });
    });
};

const SpecTests = class SurveySpecTests {
    constructor(generator, hxSurvey) {
        this.generator = generator;
        this.hxSurvey = hxSurvey;
    }

    createSurveyFn() {
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        return function () {
            const survey = generator.newSurvey();
            return models.survey.createSurvey(survey)
                .then(id => hxSurvey.push(survey, { id }));
        };
    }

    getSurveyFn(index) {
        const hxSurvey = this.hxSurvey;
        return function () {
            const surveyId = hxSurvey.id(index);
            return models.survey.getSurvey(surveyId)
                .then(survey => {
                    return comparator.survey(hxSurvey.client(index), survey)
                        .then(() => hxSurvey.updateServer(index, survey));
                });
        };
    }

    deleteSurveyFn(index) {
        const hxSurvey = this.hxSurvey;
        return function () {
            const id = hxSurvey.id(index);
            return models.survey.deleteSurvey(id)
                .then(() => hxSurvey.remove(index));
        };
    }

    listSurveysFn(scope) {
        const hxSurvey = this.hxSurvey;
        return function () {
            const options = scope ? {} : undefined;
            if (scope) {
                options.scope = scope;
            }
            return models.survey.listSurveys(options)
                .then(surveys => {
                    const expected = hxSurvey.listServersByScope(scope);
                    expect(surveys).to.deep.equal(expected);
                });
        };
    }
};

const IntegrationTests = class SurveyIntegrationTests {
    constructor(rrSuperTest, generator, hxSurvey) {
        this.rrSuperTest = rrSuperTest;
        this.generator = generator;
        this.hxSurvey = hxSurvey;
    }

    createSurveyFn() {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function (done) {
            const survey = generator.newSurvey();
            rrSuperTest.post('/surveys', survey, 201)
                .expect(function (res) {
                    hxSurvey.push(survey, res.body);
                })
                .end(done);
        };
    }

    getSurveyFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function (done) {
            if (index === null || index === undefined) {
                index = hxSurvey.lastIndex();
            }
            const id = hxSurvey.id(index);
            rrSuperTest.get(`/surveys/${id}`, true, 200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.reloadServer(res.body);
                    const expected = hxSurvey.client(index);
                    comparator.survey(expected, res.body)
                        .then(done, done);
                });
        };
    }

    deleteSurveyFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function (done) {
            const id = hxSurvey.id(index);
            rrSuperTest.delete(`/surveys/${id}`, 204)
                .expect(function () {
                    hxSurvey.remove(index);
                })
                .end(done);
        };
    }

    listSurveysFn(scope) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function (done) {
            const query = scope ? { scope } : undefined;
            rrSuperTest.get('/surveys', true, 200, query)
                .expect(function (res) {
                    const expected = hxSurvey.listServersByScope(scope);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    }
};

module.exports = {
    formAnswersToPost,
    formAnsweredSurvey,
    updateIds,
    SpecTests,
    IntegrationTests
};
