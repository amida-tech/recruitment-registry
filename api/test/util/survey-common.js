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

module.exports = {
    formAnswersToPost,
    formAnsweredSurvey,
    SpecTests
};
