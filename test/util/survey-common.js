'use strict';

/* eslint no-param-reassign: 0, max-len: 0, no-restricted-syntax: 0 */

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const comparator = require('./comparator');
const History = require('./history');
const errHandlerSpec = require('./err-handler-spec');
const PatchGenerator = require('./generator/survey-patch-generator');

const expect = chai.expect;

const answerValueType = [
    'textValue', 'code', 'monthValue', 'yearValue', 'dayValue', 'integerValue', 'boolValue',
];

const formAnswersToPost = function (survey, answersSpec) {
    const questions = survey.questions;
    return answersSpec.reduce((r, spec, index) => {
        if (spec !== null) {
            const entry = {
                questionId: questions[index].id,
                answer: {},
            };
            if (spec.choices) {
                entry.answer.choices = spec.choices.map((cindex) => {
                    const { id } = questions[index].choices[cindex.index];
                    const result = { id };
                    const numValues = answerValueType.reduce((r2, p) => {
                        if (Object.prototype.hasOwnProperty.call(cindex, p)) {
                            result[p] = cindex[p];
                            return r2 + 1;
                        }
                        return r2;
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
};

const formAnsweredSurvey = function (survey, answers) {
    const result = _.cloneDeep(survey);
    result.questions.forEach((question, index) => {
        question.answer = answers[index].answer;
        question.language = answers.language || 'en';
    });
    return result;
};

const updateEnableWhenIds = function (enableWhen, questionIdMap, sectionIdMap, ruleIdMap) {
    enableWhen.forEach((rule) => {
        rule.id = ruleIdMap[rule.id];
        if (rule.questionId) {
            rule.questionId = questionIdMap[rule.questionId].questionId;
        }
        if (rule.sectionId) {
            rule.sectionId = sectionIdMap[rule.sectionId];
        }
    });
};

let updateQuestionIds = null;

const updateSectionIds = function (sections, questionIdMap, sectionIdMap, ruleIdMap) {
    sections.forEach((section) => {
        const sectionId = sectionIdMap[section.id];
        if (!sectionId) {
            throw new Error(`updateIds: section id '${sectionId}' does not exist in the map`);
        }
        section.id = sectionId;
        if (section.enableWhen) {
            updateEnableWhenIds(section.enableWhen, questionIdMap, sectionIdMap, ruleIdMap);
        }
        if (section.sections) {
            return updateSectionIds(section.sections, questionIdMap, sectionIdMap, ruleIdMap);
        }
        if (section.questions) {
            return updateQuestionIds(section.questions, questionIdMap, sectionIdMap, ruleIdMap);
        }
        return null;
    });
};

updateQuestionIds = function (questions, questionIdMap, sectionIdMap, ruleIdMap) {
    questions.forEach((question) => {
        const questionIdObj = questionIdMap[question.id];
        if (!questionIdObj) {
            throw new Error(`updateIds: question id '${question.id}' does not exist in the map`);
        }
        question.id = questionIdObj.questionId;
        if (question.choices) {
            const choicesIds = questionIdObj.choicesIds;
            question.choices.forEach((choice) => { choice.id = choicesIds[choice.id]; });
        }
        if (question.enableWhen) {
            updateEnableWhenIds(question.enableWhen, questionIdMap, sectionIdMap, ruleIdMap);
        }
        if (question.sections) {
            updateSectionIds(question.sections, questionIdMap, sectionIdMap, ruleIdMap);
        }
    });
};

const updateIds = function (surveys, idMap, questionIdMap, sectionIdMap, ruleIdMap) {
    surveys.forEach((survey) => {
        const surveyId = idMap[survey.id];
        if (!surveyId) {
            throw new Error(`updateIds: id for '${survey.name}' does not exist in the map`);
        }
        survey.id = surveyId;
        const { sections, questions } = survey;
        if (sections) {
            updateSectionIds(sections, questionIdMap, sectionIdMap, ruleIdMap);
        }
        if (questions) {
            updateQuestionIds(questions, questionIdMap, sectionIdMap, ruleIdMap);
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

const iterSections = function* iterSections(parent) {
    const sections = parent.sections;
    if (sections) {
        for (const section of sections) {
            yield section;
            yield* iterSections(section);
        }
        return;
    }
    const questions = parent.questions;
    if (questions) {
        for (const question of questions) {
            yield* iterSections(question);
        }
    }
};

const iterQuestions = function* iterQuestions(parent) {
    const sections = parent.sections;
    if (sections) {
        for (const section of sections) {
            yield* iterQuestions(section);
        }
        return;
    }
    const questions = parent.questions;
    if (questions) {
        for (const question of questions) {
            yield question;
            yield* iterQuestions(question);
        }
    }
};

const dualForEachIter = function (leftIter, rightIter, callback) {
    const leftArray = Array.from(leftIter);
    const rightArray = Array.from(rightIter);
    const zipped = _.zip(leftArray, rightArray);
    zipped.forEach(([left, right], index) => {
        callback(left, right, index);
    });
};

const dualForEachQuestion = function (left, right, callback) {
    dualForEachIter(iterQuestions(left), iterQuestions(right), callback);
};

const dualForEachSection = function (left, right, callback) {
    dualForEachIter(iterSections(left), iterSections(right), callback);
};

const Tests = class SurveyTests {
    constructor(generator, hxSurvey, hxQuestion) {
        this.generator = generator;
        this.hxSurvey = hxSurvey;
        this.hxQuestion = hxQuestion || new History(); // not updated in all creates.
        const answerer = generator.answerer;
        this.patchGenerator = new PatchGenerator({ hxSurvey, answerer, generator });
    }

    verifySurveyFn(index, { noSectionId } = {}) {
        const self = this;
        const hxSurvey = this.hxSurvey;
        return function verifySurvey() {
            const expected = _.cloneDeep(hxSurvey.server(index));
            const surveyId = hxSurvey.id(index);
            return self.getSurveyPx(surveyId)
                .then((survey) => {
                    if (noSectionId) {
                        removeSurveySectionIds(expected);
                        removeSurveySectionIds(survey);
                    }
                    expect(survey).to.deep.equal(expected);
                });
        };
    }

    patchSurveyFn(index, patch, options = {}) {
        const self = this;
        return function patchSurvey() {
            const survey = self.hxSurvey.server(index);
            Object.assign(survey, patch);
            _.forOwn(patch, (value, key) => {
                if (value === null) {
                    delete survey[key];
                }
            });
            let payload;
            if (options.complete) {
                payload = _.cloneDeep(_.omit(survey, ['id', 'authorId']));
                payload.complete = true;
            } else {
                payload = patch;
            }
            return self.patchSurveyPx(survey.id, payload);
        };
    }

    patchSameSurveyFn(index) {
        const self = this;
        return function patchSameSurvey() {
            const survey = self.hxSurvey.server(index);
            const patch = _.omit(_.cloneDeep(survey), ['id', 'authorId']);
            patch.complete = true;
            return self.patchSurveyPx(survey.id, patch);
        };
    }

    patchSameSurveyEnableWhenFn(index) {
        const self = this;
        return function patchSameEnableWhen() {
            const survey = _.cloneDeep(self.hxSurvey.server(index));
            const client = self.hxSurvey.client(index);
            const callback = (clientParent, serverParent) => {
                const enableWhen = clientParent.enableWhen;
                if (enableWhen) {
                    serverParent.enableWhen = enableWhen;
                    return;
                }
                delete serverParent.enableWhen;
            };
            dualForEachQuestion(client, survey, callback);
            dualForEachSection(client, survey, callback);
            const patch = _.omit(survey, ['id', 'authorId']);
            patch.complete = true;
            return self.patchSurveyPx(survey.id, patch);
        };
    }

    patchSurveyFromSpecFn(spec) {
        const self = this;
        return function patchSurveyFromSpec() {
            const patch = self.patchGenerator.generateSurveyPatch(spec);
            const index = spec.surveyIndex;
            const id = self.hxSurvey.id(index);
            patch.complete = true;
            delete patch.id;
            delete patch.authorId;
            return self.patchSurveyPx(id, patch);
        };
    }

    getSurveyFromSpecFn(spec) {
        const self = this;
        return function getSurveyFromSpec() {
            const surveyId = self.hxSurvey.id(spec.surveyIndex);
            return self.getSurveyPx(surveyId)
                .then((survey) => {
                    self.patchGenerator.compareAndReplace(spec, survey);
                });
        };
    }

    errorPatchSurveyFn(index, patch, options = {}) {
        const self = this;
        return function errorPatchSurvey() {
            const survey = _.cloneDeep(self.hxSurvey.server(index));
            Object.assign(survey, patch);
            _.forOwn(patch, (value, key) => {
                if (value === null) {
                    delete survey[key];
                }
            });
            let payload;
            if (options.complete) {
                payload = _.cloneDeep(_.omit(survey, ['id', 'authorId']));
                payload.complete = true;
            } else {
                payload = patch;
            }
            return self.errorPatchSurveyPx(survey.id, patch, options);
        };
    }

    errorStatusChangeFn(index, status, options, complete) {
        const self = this;
        const hxSurvey = this.hxSurvey;
        return function errorStatusChange() {
            const id = hxSurvey.id(index);
            const patch = { status };
            if (complete) {
                Object.assign({ complete }, hxSurvey.server(index), patch);
            }
            return self.errorPatchSurveyPx(id, patch, options);
        };
    }
};

const SpecTests = class SurveySpecTests extends Tests {
    constructor(generator, hxSurvey, hxQuestion) {
        super(generator, hxSurvey, hxQuestion);
        this.models = models;
    }

    createSurveyFn(options) {
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        return function createSurvey() {
            const survey = generator.newSurvey(options);
            return models.survey.createSurvey(survey)
                .then(id => hxSurvey.push(survey, { id }));
        };
    }

    createSurveyQxHxFn(questionIndices, options = {}) {
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        return function createSurveyQxHx() {
            const questionIds = questionIndices.map(index => hxQuestion.id(index));
            const survey = generator.newSurveyQuestionIds(questionIds, options);
            return models.survey.createSurvey(survey)
                .then((id) => {
                    const fullSurvey = _.cloneDeep(survey);
                    fullSurvey.questions = questionIndices.map((qxIndex, index) => {
                        const question = Object.assign({}, survey.questions[index]);
                        Object.assign(question, hxQuestion.server(qxIndex));
                        return question;
                    });
                    hxSurvey.push(fullSurvey, { id });
                });
        };
    }

    getSurveyFn(index) {
        const hxSurvey = this.hxSurvey;
        return function getSurvey() {
            const surveyId = hxSurvey.id(index);
            return models.survey.getSurvey(surveyId)
                .then((survey) => {
                    const client = hxSurvey.client(index);
                    comparator.survey(client, survey);
                    hxSurvey.updateServer(index, survey);
                });
        };
    }

    deleteSurveyFn(index) {
        const hxSurvey = this.hxSurvey;
        return function deleteSurvey() {
            const id = hxSurvey.id(index);
            return models.survey.deleteSurvey(id)
                .then(() => hxSurvey.remove(index));
        };
    }

    errorDeleteSurveyFn(index, errorKey) {
        const hxSurvey = this.hxSurvey;
        const errHandler = errHandlerSpec.expectedErrorHandlerFn(errorKey);
        return function errorDeleteSurvey() {
            const id = hxSurvey.id(index);
            return models.survey.deleteSurvey(id)
                .then(errHandlerSpec.throwingHandler, errHandler);
        };
    }

    listSurveysFn(options, count = -1) {
        const hxSurvey = this.hxSurvey;
        return function listSurveys() {
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

    getSurveyPx(id) {
        return this.models.survey.getSurvey(id);
    }

    patchSurveyPx(id, patch) {
        return this.models.survey.patchSurvey(id, patch);
    }

    errorPatchSurveyPx(id, patch, options) {
        const errHandler = errHandlerSpec.expectedErrorHandlerFn(options.errorKey);
        return this.models.survey.patchSurvey(id, patch)
            .then(errHandlerSpec.throwingHandler, errHandler);
    }
};

const IntegrationTests = class SurveyIntegrationTests extends Tests {
    constructor(rrSuperTest, generator, hxSurvey, hxQuestion) {
        super(generator, hxSurvey, hxQuestion);
        this.rrSuperTest = rrSuperTest;
    }

    createSurveyFn(options = {}) {
        const generator = this.generator;
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function createSurvey(done) {
            const survey = options.survey || generator.newSurvey(options);
            rrSuperTest.post('/surveys', survey, 201)
                .expect((res) => {
                    hxSurvey.push(survey, res.body);
                })
                .end(done);
        };
    }

    createSurveyQxHxFn(questionIndices, options = {}) {
        const rrSuperTest = this.rrSuperTest;
        const generator = this.generator;
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        return function createSurveyQxHx() {
            const questionIds = questionIndices.map(index => hxQuestion.id(index));
            const survey = generator.newSurveyQuestionIds(questionIds, options);
            return rrSuperTest.post('/surveys', survey, 201)
                .then((res) => {
                    const fullSurvey = _.cloneDeep(survey);
                    fullSurvey.questions = questionIndices.map((qxIndex, index) => {
                        const question = Object.assign({}, survey.questions[index]);
                        Object.assign(question, hxQuestion.server(qxIndex));
                        return question;
                    });
                    hxSurvey.push(fullSurvey, res.body);
                });
        };
    }

    getSurveyFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function getSurvey(done) {
            if (index === null || index === undefined) {
                index = hxSurvey.lastIndex();
            }
            const id = hxSurvey.id(index);
            rrSuperTest.get(`/surveys/${id}`, true, 200)
                .expect((res) => {
                    hxSurvey.reloadServer(res.body);
                    let expected = hxSurvey.client(index);
                    if (rrSuperTest.userRole === 'admin') {
                        expected = _.cloneDeep(expected);
                        expected.authorId = rrSuperTest.userId;
                    }
                    comparator.survey(expected, res.body);
                })
                .end(done);
        };
    }

    deleteSurveyFn(index) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function deleteSurvey() {
            const id = hxSurvey.id(index);
            return rrSuperTest.delete(`/surveys/${id}`, 204)
                .expect(() => {
                    hxSurvey.remove(index);
                });
        };
    }

    errorDeleteSurveyFn(index, errorKey) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function errorDeleteSurvey() {
            const id = hxSurvey.id(index);
            return rrSuperTest.delete(`/surveys/${id}`, 400)
                .then(res => errHandlerSpec.verifyErrorMessage(res, errorKey));
        };
    }

    listSurveysFn(options = {}, count = -1) {
        const rrSuperTest = this.rrSuperTest;
        const hxSurvey = this.hxSurvey;
        return function listSurveys() {
            return rrSuperTest.get('/surveys', true, 200, options)
                .then((res) => {
                    if (count >= 0) {
                        expect(res.body).to.have.length(count);
                    }
                    const opt = _.cloneDeep(options);
                    if (rrSuperTest.userRole === 'admin') {
                        opt.admin = true;
                    } else {
                        res.body.forEach(({ authorId, consentTypeIds }) => {
                            expect(consentTypeIds).to.equal(undefined);
                            expect(authorId).to.equal(undefined);
                        });
                    }
                    const expected = hxSurvey.listServersByScope(opt);
                    expect(res.body).to.deep.equal(expected);
                    return res;
                });
        };
    }

    getSurveyPx(id) {
        return this.rrSuperTest.get(`/surveys/${id}`, true, 200)
            .then(res => res.body);
    }

    patchSurveyPx(id, patch) {
        return this.rrSuperTest.patch(`/surveys/${id}`, patch, 204);
    }

    errorPatchSurveyPx(id, patch, options) {
        const errKey = options.errorKey;
        return this.rrSuperTest.patch(`/surveys/${id}`, patch, options.statusCode)
            .then(res => errHandlerSpec.verifyErrorMessage(res, errKey));
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
    iterQuestions,
};
