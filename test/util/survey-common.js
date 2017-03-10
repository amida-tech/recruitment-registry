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
                        if (Object.prototype.hasOwnProperty.call(cindex, p)) {
                            r += 1;
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
            if (Object.prototype.hasOwnProperty.call(spec, 'choice')) {
                entry.answer.choice = questions[index].choices[spec.choice].id;
            }
            if (Object.prototype.hasOwnProperty.call(spec, 'textValue')) {
                entry.answer.textValue = spec.textValue;
            }
            if (Object.prototype.hasOwnProperty.call(spec, 'boolValue')) {
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

let updateQuestionIds = null;

const updateSectionIds = function (sections, questionIdMap, sectionIdMap) {
    sections.forEach((section) => {
        const sectionId = sectionIdMap[section.id];
        if (!sectionId) {
            throw new Error(`updateIds: section id '${sectionId}' does not exist in the map`);
        }
        section.id = sectionId;
        if (section.sections) {
            return updateSectionIds(section.sections, questionIdMap, sectionIdMap);
        }
        if (section.questions) {
            return updateQuestionIds(section.questions, questionIdMap, sectionIdMap);
        }
        return null;
    });
};

updateQuestionIds = function (questions, questionIdMap, sectionIdMap) {
    questions.forEach((question) => {
        const questionIdObj = questionIdMap[question.id];
        if (!questionIdObj) {
            throw new Error(`updateIds: question id '${question.id}' does not exist in the map`);
        }
        question.id = questionIdObj.questionId;
        if (question.sections) {
            updateSectionIds(question.sections, questionIdMap, sectionIdMap);
        }
    });
};

const updateIds = function (surveys, idMap, questionIdMap, sectionIdMap) {
    surveys.forEach((survey) => {
        const surveyId = idMap[survey.id];
        if (!surveyId) {
            throw new Error(`updateIds: id for '${survey.name}' does not exist in the map`);
        }
        survey.id = surveyId;
        const { sections, questions } = survey;
        if (sections) {
            updateSectionIds(sections, questionIdMap, sectionIdMap);
        }
        if (questions) {
            updateQuestionIds(questions, questionIdMap, sectionIdMap);
        }
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
                    expect(surveys.length).to.equal(expected.length);
                    surveys.forEach((survey, index) => {
                        expect(survey).to.deep.equal(expected[index]);
                    });
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
