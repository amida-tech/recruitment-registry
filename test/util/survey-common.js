'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const comparator = require('./comparator');

const expect = chai.expect;

const formAnswersToPost = function (survey, answersSpec) {
    const questions = survey.questions;
    const result = answersSpec.reduce((r, spec, index) => {
        if (spec !== null) {
            const entry = {
                questionId: questions[index].id,
                answer: {},
            };
            if (spec.choices) {
                entry.answer.choices = spec.choices.map((cindex) => {
                    const { id } = questions[index].choices[cindex.index];
                    const result = { id };
                    const numValues = ['textValue', 'code', 'monthValue', 'yearValue', 'dayValue', 'integerValue', 'boolValue'].reduce((r, p) => {
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
    result.questions.forEach((question, index) => {
        question.answer = answers[index].answer;
        question.language = answers.language || 'en';
    });
    return result;
};

const updateIds = function (surveys, idMap, questionIdMap) {
    return surveys.map((survey) => {
        const surveyId = idMap[survey.id];
        if (!surveyId) {
            throw new Error(`updateIds: id for '${survey.name}' does not exist in the map`);
        }
        survey.id = surveyId;
        survey.questions.forEach((question) => {
            const questionIdObj = questionIdMap[question.id];
            if (!questionIdObj) {
                throw new Error(`updateIds: choice id does not exist for for '${survey.name}' in '${question.id}'`);
            }
            question.id = questionIdObj.questionId;
        });
    });
};

let removeQuestionSectionIds;
let removeSurveySectionIds;

const removeSectionIds = function removeSectionIds(sections) {
    if (sections) {
        sections.forEach((section) => {
            delete section.id;
            removeSectionIds(section.sections);
            removeQuestionSectionIds(section.questions);
        });
    }
};

removeQuestionSectionIds = function (questions) {
    if (questions) {
        questions.forEach(({ sections }) => {
            if (sections) {
                sections.forEach((section) => {
                    delete section.id;
                    removeSurveySectionIds(section);
                });
            }
        });
    }
};

removeSurveySectionIds = function ({ questions, sections }) {
    removeSectionIds(sections);
    removeQuestionSectionIds(questions);
};

const formQuestionsSectionsSurveyPatch = function (survey, { questions, sections }) {
    const surveyPatch = { forceQuestions: true };
    if (sections) {
        sections = _.cloneDeep(sections);
        removeSectionIds(sections);
        surveyPatch.sections = sections;
        survey.sections = sections;
        delete survey.questions;
        return surveyPatch;
    }
    if (questions) {
        questions = _.cloneDeep(questions);
        removeQuestionSectionIds(questions);
        surveyPatch.questions = questions;
        survey.questions = questions;
        delete survey.sections;
        return surveyPatch;
    }
    throw new Error('Surveys should have either sections or questions.');
};

const SpecTests = class SurveySpecTests {
    constructor(generator, hxSurvey) {
        this.generator = generator;
        this.hxSurvey = hxSurvey;
    }

    createSurveyFn(options) {
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        return function () {
            const survey = generator.newSurvey(options);
            return models.survey.createSurvey(survey)
                .then(id => hxSurvey.push(survey, { id }));
        };
    }

    getSurveyFn(index) {
        const hxSurvey = this.hxSurvey;
        return function () {
            const surveyId = hxSurvey.id(index);
            return models.survey.getSurvey(surveyId)
                .then((survey) => {
                    comparator.survey(hxSurvey.client(index), survey);
                    hxSurvey.updateServer(index, survey);
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

    listSurveysFn(options, count = -1) {
        const hxSurvey = this.hxSurvey;
        return function () {
            return models.survey.listSurveys(options)
                .then((surveys) => {
                    if (count >= 0) {
                        expect(surveys).to.have.length(count);
                    }
                    const expected = hxSurvey.listServersByScope(options);
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

    createSurveyFn(options) {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function (done) {
            const survey = generator.newSurvey(options);
            rrSuperTest.post('/surveys', survey, 201)
                .expect((res) => {
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
                .expect((res) => {
                    hxSurvey.reloadServer(res.body);
                    const expected = hxSurvey.client(index);
                    comparator.survey(expected, res.body);
                })
                .end(done);
        };
    }

    deleteSurveyFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function (done) {
            const id = hxSurvey.id(index);
            rrSuperTest.delete(`/surveys/${id}`, 204)
                .expect(() => {
                    hxSurvey.remove(index);
                })
                .end(done);
        };
    }

    listSurveysFn(options, count = -1) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function (done) {
            rrSuperTest.get('/surveys', true, 200, options)
                .expect((res) => {
                    if (count >= 0) {
                        expect(res.body).to.have.length(count);
                    }
                    const expected = hxSurvey.listServersByScope(options);
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
    removeSectionIds,
    removeSurveySectionIds,
    formQuestionsSectionsSurveyPatch,
    SpecTests,
    IntegrationTests,
};
