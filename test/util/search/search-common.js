/* global it*/

'use strict';

const path = require('path');
const fs = require('fs');
const chai = require('chai');
const _ = require('lodash');
const intoStream = require('into-stream');
const mkdirp = require('mkdirp');

const config = require('../../../config');

const models = require('../../../models');
const SharedSpec = require('../shared-spec');
const SharedIntegration = require('../shared-integration');
const Generator = require('../generator');
const History = require('../history');
const SurveyHistory = require('../survey-history');
const answerCommon = require('../answer-common');
const questionCommon = require('../question-common');

const QuestionGenerator = require('../generator/question-generator');
const MultiQuestionGenerator = require('../generator/multi-question-generator');
const SurveyGenerator = require('../generator/survey-generator');
const ImportCSVConverter = require('../../../import/csv-converter.js');

const testCase0 = require('./test-case-0');

const expect = chai.expect;

const answerGenerators = {
    text(questionId, spec) {
        return { answer: { textValue: spec.value } };
    },
    bool(questionId, spec) {
        return { answer: { boolValue: spec.value } };
    },
    choice(questionId, spec, choiceIdMap) {
        const choiceIds = choiceIdMap.get(questionId);
        const choice = choiceIds[spec.choiceIndex];
        return { answer: { choice } };
    },
    choices(questionId, spec, choiceIdMap) {
        const choiceIds = choiceIdMap.get(questionId);
        const choices = spec.choiceIndices.map(choiceIndex => ({ id: choiceIds[choiceIndex] }));
        return { answer: { choices } };
    },
    multitext(questionId, spec) {
        const values = spec.values;
        const fn = (textValue, multipleIndex) => ({ textValue, multipleIndex });
        const answers = values.map(fn);
        return { answers };
    },
    multibool(questionId, spec) {
        const values = spec.values;
        const fn = (boolValue, multipleIndex) => ({ boolValue, multipleIndex });
        const answers = values.map(fn);
        return { answers };
    },
    multichoice(questionId, spec, choiceIdMap) {
        const choiceIds = choiceIdMap.get(questionId);
        const fn = (index, multipleIndex) => ({ choice: choiceIds[index], multipleIndex });
        const answers = spec.choiceIndices.map(fn);
        return { answers };
    },
};

const Tests = class BaseTests {
    constructor(offset = 5, surveyCount = 4) {
        this.offset = offset;
        this.surveyCount = surveyCount;

        const hxUser = new History();
        const hxSurvey = new SurveyHistory();
        const hxQuestion = new History();

        this.hxUser = hxUser;
        this.hxSurvey = hxSurvey;
        this.hxQuestion = hxQuestion;

        const questionGenerator = new QuestionGenerator();
        const multiQuestionGenerator = new MultiQuestionGenerator();
        this.surveyGenerator = new SurveyGenerator();

        const typeIndexMap = new Map();
        const types = [];
        const questions = [];
        ['choice', 'choices', 'text', 'bool'].forEach((type) => {
            const options = { type, choiceCount: 6, noText: true, noOneOf: true };
            types.push(type);
            const indices = [];
            typeIndexMap.set(type, indices);
            _.range(surveyCount).forEach(() => {
                indices.push(offset + questions.length);
                const question = questionGenerator.newQuestion(options);
                questions.push(question);
            });
        });
        ['choice', 'text', 'bool'].forEach((type) => {
            const options = { type, choiceCount: 6, noOneOf: true, max: 5 };
            const multiType = `multi${type}`;
            types.push(multiType);
            const indices = [];
            typeIndexMap.set(multiType, indices);
            _.range(surveyCount).forEach(() => {
                indices.push(offset + questions.length);
                const question = multiQuestionGenerator.newMultiQuestion(options);
                questions.push(question);
            });
        });

        this.typeIndexMap = typeIndexMap;
        this.types = types;
        this.questions = questions;

        this.choiceIdMap = new Map();
    }

    generateChoiceMapFn() {
        const typeIndexMap = this.typeIndexMap;
        const hxQuestion = this.hxQuestion;
        const choiceIdMap = this.choiceIdMap;
        return function generateChoiceMap() {
            ['choice', 'choices', 'multichoice'].forEach((type) => {
                const questionIndices = typeIndexMap.get(type);
                questionIndices.forEach((questionIndex) => {
                    const question = hxQuestion.server(questionIndex);
                    const choices = question.choices;
                    expect(choices).to.have.length.above(0);
                    const questionChoiceIds = [];
                    choiceIdMap.set(question.id, questionChoiceIds);
                    choices.forEach((choice) => {
                        const choiceType = choice.type;
                        if (choiceType !== 'text') {
                            const choiceId = choice.id;
                            questionChoiceIds.push(choiceId);
                        }
                    });
                    expect(questionChoiceIds).to.have.length.above(5);
                });
            });
        };
    }

    answerInfoToObject(surveyIndex, answerInfo, idProperty = 'questionId') {
        return answerInfo.map((info) => {
            const questionType = info.questionType;
            const questionIndex = this.typeIndexMap.get(questionType)[surveyIndex];
            const questionId = this.hxQuestion.id(questionIndex);
            const answerGenerator = answerGenerators[questionType];
            const answerObject = answerGenerator(questionId, info, this.choiceIdMap);
            return Object.assign({ [idProperty]: questionId }, answerObject);
        });
    }

    getCase(index) {
        return testCase0.searchCases[index];
    }

    formCriteria(inputAnswers) {
        const rawQuestions = inputAnswers.reduce((r, { surveyIndex, answerInfo }) => {
            const answers = this.answerInfoToObject(surveyIndex, answerInfo, 'id');
            r.push(...answers);
            return r;
        }, []);
        const questions = rawQuestions.map(({ id, answer, answers }) => {
            if (answer) {
                return { id, answers: [answer] };
            }
            const a = answers.map(r => _.omit(r, 'multipleIndex'));
            return { id, answers: a };
        });
        return { questions };
    }

    getCriteria(index) {
        const { count, answers } = this.getCase(index);
        const criteria = this.formCriteria(answers);
        return { count, criteria };
    }
};

const SpecTests = class SearchSpecTests extends Tests {
    constructor(inputModels, offset = 5, surveyCount = 4, sync = true) {
        super(offset, surveyCount);
        this.models = inputModels || models;
        const generator = new Generator();

        this.sync = sync;
        this.shared = new SharedSpec(generator, this.models);
        this.answerTests = new answerCommon.SpecTests(generator, this.hxUser, this.hxSurvey, this.hxQuestion);
        const qxCommonParameters = { generator, hxQuestion: this.hxQuestion };
        this.questionTests = new questionCommon.SpecTests(qxCommonParameters, this.models);
        this.hxAnswers = this.answerTests.hxAnswer;
    }

    createSurveyFn(qxIndices) {
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        const surveyGenerator = this.surveyGenerator;
        const m = this.models;
        return function createSurvey() {
            const survey = surveyGenerator.newBody();
            survey.questions = qxIndices.map(index => ({
                id: hxQuestion.server(index).id,
                required: false,
            }));
            return m.survey.createSurvey(survey)
                .then((id) => {
                    hxSurvey.push(survey, { id });
                });
        };
    }

    searchAnswerCountFn({ count, answers }) {
        const m = this.models;
        const self = this;
        return function searchAnswerCount() {
            const criteria = self.formCriteria(answers);
            return m.answer.searchCountUsers(criteria)
                .then(({ count: actual }) => expect(actual).to.equal(count));
        };
    }

    searchAnswerUsersFn({ userIndices, answers }) {
        const m = this.models;
        const self = this;
        return function searchAnswerUsers() {
            const criteria = self.formCriteria(answers);
            return m.answer.searchUsers(criteria)
                .then((userIds) => {
                    const actual = userIds.map(({ userId }) => userId);
                    const expected = userIndices.map(index => self.hxUser.id(index));
                    expect(actual).to.deep.equal(expected);
                });
        };
    }

    exportAnswersForUsersFn({ userIndices }, store) {
        const m = this.models;
        const self = this;
        return function exportAnswersForUsers() {
            const userIds = userIndices.map(index => self.hxUser.id(index));
            return m.answer.exportForUsers(userIds)
                .then((result) => {
                    expect(result).to.have.length.above(userIndices.length - 1);
                    store.allContent = result;
                });
        };
    }

    searchEmptyFn(count) {
        const m = this.models;
        return function searchEmpty() {
            return m.answer.searchCountUsers({})
                .then(({ count: actual }) => expect(actual).to.equal(count));
        };
    }

    createAnswersFn(userIndex, surveyIndex, answerInfo) {
        const self = this;
        const hxUser = this.hxUser;
        const hxSurvey = this.hxSurvey;
        const hxAnswers = this.hxAnswers;
        const m = this.models;
        return function createAnswers() {
            const userId = hxUser.id(userIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            const answers = self.answerInfoToObject(surveyIndex, answerInfo);
            const input = { userId, surveyId, answers };
            return m.answer.createAnswers(input)
                .then(() => hxAnswers.push(userIndex, surveyIndex, answers));
        };
    }

    compareExportToCohortFn(store, limit) {
        return function compareExportToCohort() {
            const converter = new ImportCSVConverter({ checkType: false });
            const streamFullExport = intoStream(store.allContent);
            return converter.streamToRecords(streamFullExport)
                .then((recordsFullExport) => {
                    const streamCohort = intoStream(store.cohort);
                    return converter.streamToRecords(streamCohort)
                        .then((recordsCohort) => {
                            expect(recordsCohort.length).to.be.above(0);
                            if (limit) {
                                const userIdSet = new Set(recordsCohort.map(({ userId }) => userId));
                                const filterRecordsFull = recordsFullExport.reduce((r, record) => {
                                    if (userIdSet.has(record.userId)) {
                                        r.push(record);
                                    }
                                    return r;
                                }, []);
                                expect(filterRecordsFull).to.deep.equal(recordsCohort);
                            } else {
                                expect(recordsFullExport).to.deep.equal(recordsCohort);
                            }
                        });
                });
        };
    }

    createCohortFn(store, limited, userCount) {
        const m = this.models;
        return function createCohort() {
            const count = limited ? userCount - 1 : 10000;
            return m.cohort.createCohort(({ filterId: store.id, count }))
                .then((result) => { store.cohort = result; });
        };
    }

    patchCohortFn(id, store, limited, userCount) {
        const m = this.models;
        return function createCohort() {
            const count = limited ? userCount - 1 : 10000;
            return m.cohort.patchCohort(id, { count })
                .then((result) => { store.cohort = result; });
        };
    }

    createFilterFn(index, searchCase, store) {
        const self = this;
        const m = this.models;
        return function createFilter() {
            const filter = { name: `name_${index}`, maxCount: 5 };
            Object.assign(filter, self.formCriteria(searchCase.answers));
            return m.filter.createFilter(filter)
                .then(({ id }) => { store.id = id; });
        };
    }

    patchFilterFn(searchCase, store) {
        const self = this;
        const m = this.models;
        return function patchFilter() {
            const filterPatch = self.formCriteria(searchCase.answers);
            return m.filter.patchFilter(store.id, filterPatch);
        };
    }

    answerSearchUnitFn() {
        const self = this;
        return function answerSearchUnit() {
            if (self.sync) {
                it('sync models', self.shared.setUpFn());
            }

            _.range(5).forEach((index) => {
                it(`create user ${index}`, self.shared.createUserFn(self.hxUser));
            });

            _.range(self.offset).forEach((index) => {
                it(`create question ${index}`, self.questionTests.createQuestionFn());
                it(`get question ${index}`, self.questionTests.getQuestionFn(index));
            });

            self.questions.forEach((question, index) => {
                const actualIndex = self.offset + index;
                it(`create question ${actualIndex}`, self.questionTests.createQuestionFn({ question }));
                it(`get question ${actualIndex}`, self.questionTests.getQuestionFn(actualIndex));
            });

            it('create a map of all choice/choice question choices', self.generateChoiceMapFn());

            _.range(self.surveyCount).forEach((index) => {
                const qxIndices = self.types.map(type => self.typeIndexMap.get(type)[index]);
                it(`create survey ${index}`, self.createSurveyFn(qxIndices));
            });

            const answerSequence = testCase0.answerSequence;

            answerSequence.forEach(({ userIndex, surveyIndex, answerInfo }) => {
                const msg = `user ${userIndex} answers survey ${surveyIndex}`;
                it(msg, self.createAnswersFn(userIndex, surveyIndex, answerInfo));
            });

            it('search empty criteria', self.searchEmptyFn(5));

            const searchCases = testCase0.searchCases;

            let cohortId = 1;
            searchCases.forEach((searchCase, index) => {
                it(`search case ${index} count`, self.searchAnswerCountFn(searchCase));
                it(`search case ${index} user ids`, self.searchAnswerUsersFn(searchCase));
                if (searchCase.count > 1) {
                    const store = {};
                    it(`search case ${index} export answers`, self.exportAnswersForUsersFn(searchCase, store));
                    it(`create filter ${index}`, self.createFilterFn(index, searchCase, store));
                    it(`create cohort ${3 * index} (no count)`, self.createCohortFn(store, false));
                    it(`compare cohort ${3 * index}`, self.compareExportToCohortFn(store, false));
                    it(`patch cohort ${3 * index} (no count)`, self.patchCohortFn(cohortId, store, false));
                    it(`compare cohort ${3 * index}`, self.compareExportToCohortFn(store, false));
                    cohortId += 1;
                    it(`create cohort ${(3 * index) + 1} (large count)`, self.createCohortFn(store, true, 10000));
                    it(`compare cohort ${3 * index}`, self.compareExportToCohortFn(store, false));
                    it(`patch cohort ${(3 * index) + 1} (large count)`, self.patchCohortFn(cohortId, store, true, 10000));
                    it(`compare cohort ${(3 * index) + 1}`, self.compareExportToCohortFn(store, false));
                    cohortId += 1;
                    it(`create cohort ${(3 * index) + 2} (limited count`, self.createCohortFn(store, true, searchCase.count));
                    it(`compare cohort ${(3 * index) + 2}`, self.compareExportToCohortFn(store, true));
                    it(`patch cohort ${(3 * index) + 3} (limited count)`, self.patchCohortFn(cohortId, store, true, searchCase.count));
                    it(`compare cohort ${(3 * index) + 3}`, self.compareExportToCohortFn(store, true));
                    it(`patch filter ${index} for empty`, self.patchFilterFn(testCase0.emptyCase, store));
                    it(`patch cohort ${3 * index} filter edit (no count)`, self.patchCohortFn(cohortId, store, false));
                    it(`compare cohort ${3 * index} filter edit`, self.compareExportToCohortFn(store, false));
                    cohortId += 1;
                }
            });
        };
    }
};

const IntegrationTests = class SearchIntegrationTests extends Tests {
    constructor(rrSuperTest, offset = 5, surveyCount = 4, sync = true) {
        super(offset, surveyCount);
        this.rrSuperTest = rrSuperTest;
        const generator = new Generator();

        this.sync = sync;
        this.shared = new SharedIntegration(rrSuperTest, generator);
        this.answerTests = new answerCommon.IntegrationTests(rrSuperTest, generator, this.hxUser, this.hxSurvey, this.hxQuestion);
        const qxCommonParameters = { generator, hxQuestion: this.hxQuestion };
        this.questionTests = new questionCommon.IntegrationTests(rrSuperTest, qxCommonParameters);
        this.hxAnswers = this.answerTests.hxAnswer;
    }

    updateRRSuperTest(rrSuperTest) {
        this.rrSuperTest = rrSuperTest;
        this.shared.rrSuperTest = rrSuperTest;
        this.answerTests.rrSuperTest = rrSuperTest;
        this.questionTests.rrSuperTest = rrSuperTest;
    }

    createSurveyFn(qxIndices) {
        const hxSurvey = this.hxSurvey;
        const hxQuestion = this.hxQuestion;
        const surveyGenerator = this.surveyGenerator;
        const rrSuperTest = this.rrSuperTest;
        return function createSurvey() {
            const survey = surveyGenerator.newBody();
            survey.questions = qxIndices.map(index => ({
                id: hxQuestion.server(index).id,
                required: false,
            }));
            return rrSuperTest.post('/surveys', survey, 201)
                .expect((res) => {
                    hxSurvey.push(survey, res.body);
                });
        };
    }

    searchAnswerCountFn({ count, answers }) {
        const rrSuperTest = this.rrSuperTest;
        const self = this;
        return function searchAnswerCount() {
            const criteria = self.formCriteria(answers);
            return rrSuperTest.post('/answers/queries', criteria, 200)
                .expect(res => expect(res.body.count).to.equal(count));
        };
    }

    searchAnswerUsersFn({ userIndices, answers }) {
        const rrSuperTest = this.rrSuperTest;
        const self = this;
        return function searchAnswerUsers() {
            const criteria = self.formCriteria(answers);
            return rrSuperTest.post('/answers/user-ids', criteria, 200)
                .then((res) => {
                    const actual = res.body.map(({ userId }) => userId);
                    const expected = userIndices.map(index => self.hxUser.id(index));
                    expect(actual).to.deep.equal(expected);
                });
        };
    }

    exportAnswersForUsersFn({ userIndices }, filepath) {
        const rrSuperTest = this.rrSuperTest;
        const self = this;
        return function exportAnswersForUsers() {
            const userIds = userIndices.map(index => self.hxUser.id(index));
            return rrSuperTest.get('/answers/multi-user-csv', true, 200, { 'user-ids': userIds })
                .then(res => fs.writeFileSync(filepath, res.text));
        };
    }

    createAnswersFn(userIndex, surveyIndex, answerInfo) {
        const self = this;
        const hxSurvey = this.hxSurvey;
        const hxAnswers = this.hxAnswers;
        const rrSuperTest = this.rrSuperTest;
        return function createAnswers() {
            const surveyId = hxSurvey.id(surveyIndex);
            const answers = self.answerInfoToObject(surveyIndex, answerInfo);
            const input = { surveyId, answers, language: 'en' };
            return rrSuperTest.post('/answers', input, 204)
                .expect(() => hxAnswers.push(userIndex, surveyIndex, answers));
        };
    }

    compareExportToCohortFn(filepath, cohortFilepath, limit) {
        return function compareExportToCohort() {
            const converter = new ImportCSVConverter({ checkType: false });
            const streamFullExport = fs.createReadStream(filepath);
            return converter.streamToRecords(streamFullExport)
                .then((recordsFullExport) => {
                    const streamCohort = fs.createReadStream(cohortFilepath);
                    return converter.streamToRecords(streamCohort)
                        .then((recordsCohort) => {
                            expect(recordsFullExport.length).to.be.above(2);
                            expect(recordsCohort.length).to.be.above(2);
                            if (limit) {
                                const userIdSet = new Set(recordsCohort.map(({ userId }) => userId));
                                const filterRecordsFull = recordsFullExport.reduce((r, record) => {
                                    if (userIdSet.has(record.userId)) {
                                        r.push(record);
                                    }
                                    return r;
                                }, []);
                                expect(filterRecordsFull).to.deep.equal(recordsCohort);
                            } else {
                                expect(recordsFullExport).to.deep.equal(recordsCohort);
                            }
                        });
                });
        };
    }

    createCohortFn(store, filepath, limited, userCount) {
        const rrSuperTest = this.rrSuperTest;
        return function createCohort() {
            const count = limited ? userCount - 1 : 10000;
            const payload = { filterId: store.id, count };
            return rrSuperTest.post('/cohorts', payload, 201)
                .then(res => fs.writeFileSync(filepath, res.text));
        };
    }

    patchCohortFn(id, store, filepath, limited, userCount) {
        const rrSuperTest = this.rrSuperTest;
        return function createCohort() {
            const count = limited ? userCount - 1 : 10000;
            const payload = { count };
            return rrSuperTest.patch(`/cohorts/${id}`, payload, 200)
                .then(res => fs.writeFileSync(filepath, res.text));
        };
    }

    createFilterFn(index, searchCase, store) {
        const self = this;
        const rrSuperTest = this.rrSuperTest;
        return function createFilter() {
            const filter = { name: `name_${index}`, maxCount: 5 };
            Object.assign(filter, self.formCriteria(searchCase.answers));
            return rrSuperTest.post('/filters', filter, 201)
                .then((res) => { store.id = res.body.id; });
        };
    }

    patchFilterFn(searchCase, store) {
        const self = this;
        const rrSuperTest = this.rrSuperTest;
        return function patchFilter() {
            const filterPatch = self.formCriteria(searchCase.answers);
            return rrSuperTest.patch(`/filters/${store.id}`, filterPatch, 204);
        };
    }

    answerSearchIntegrationFn() {
        const self = this;
        return function answerSearchIntegration() {
            if (self.sync) {
                it('sync models', self.shared.setUpFn());
            }
            const generatedDirectory = path.join(__dirname, '../../generated');

            it('create output directory if necessary', (done) => {
                mkdirp(generatedDirectory, done);
            });

            it('login as super', self.shared.loginFn(config.superUser));

            _.range(5).forEach((index) => {
                it(`create user ${index}`, self.shared.createUserFn(self.hxUser));
            });

            _.range(self.offset).forEach((index) => {
                it(`create question ${index}`, self.questionTests.createQuestionFn());
                it(`get question ${index}`, self.questionTests.getQuestionFn(index));
            });

            self.questions.forEach((question, index) => {
                const actualIndex = self.offset + index;
                it(`create question ${actualIndex}`, self.questionTests.createQuestionFn({ question }));
                it(`get question ${actualIndex}`, self.questionTests.getQuestionFn(actualIndex));
            });

            it('create a map of all choice/choice question choices', self.generateChoiceMapFn());

            _.range(self.surveyCount).forEach((index) => {
                const qxIndices = self.types.map(type => self.typeIndexMap.get(type)[index]);
                it(`create survey ${index}`, self.createSurveyFn(qxIndices));
            });

            it('logout as super', self.shared.logoutFn());

            const answerSequence = testCase0.answerSequence;

            answerSequence.forEach(({ userIndex, surveyIndex, answerInfo }) => {
                it(`login as user ${userIndex}`, self.shared.loginIndexFn(self.hxUser, userIndex));
                const msg = `user ${userIndex} answers survey ${surveyIndex}`;
                it(msg, self.createAnswersFn(userIndex, surveyIndex, answerInfo));
                it(`logout as user ${userIndex}`, self.shared.logoutFn());
            });

            const searchCases = testCase0.searchCases;

            it('login as super', self.shared.loginFn(config.superUser));
            let cohortId = 1;
            searchCases.forEach((searchCase, index) => {
                it(`search case ${index} count`, self.searchAnswerCountFn(searchCase));
                it(`search case ${index} user ids`, self.searchAnswerUsersFn(searchCase));
                if (searchCase.count > 1) {
                    const store = {};
                    let cohortFilepath;
                    let cohortPatchFilepath;
                    const filepath = path.join(generatedDirectory, `answer-multi_${index}.csv`);
                    it(`search case ${index} export answers`, self.exportAnswersForUsersFn(searchCase, filepath));
                    it(`create filter ${index}`, self.createFilterFn(index, searchCase, store));
                    cohortFilepath = path.join(generatedDirectory, `cohort_${3 * index}.csv`);
                    cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${3 * index}.csv`);
                    it(`create cohort ${3 * index} (no count)`, self.createCohortFn(store, cohortFilepath, false));
                    it(`compare cohort ${3 * index}`, self.compareExportToCohortFn(filepath, cohortFilepath, false));
                    it(`patch cohort ${3 * index} (no count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, false));
                    it(`compare cohort ${3 * index}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, false));
                    cohortId += 1;
                    cohortFilepath = path.join(generatedDirectory, `cohort_${(3 * index) + 1}.csv`);
                    cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${(3 * index) + 1}.csv`);
                    it(`create cohort ${(3 * index) + 1} (large count)`, self.createCohortFn(store, cohortFilepath, true, 10000));
                    it(`compare cohort ${(3 * index) + 1}`, self.compareExportToCohortFn(filepath, cohortFilepath, false));
                    it(`patch cohort ${(3 * index) + 1} (large count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, true, 10000));
                    it(`compare cohort ${(3 * index) + 1}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, false));
                    cohortId += 1;
                    cohortFilepath = path.join(generatedDirectory, `cohort_${(3 * index) + 2}.csv`);
                    cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${(3 * index) + 2}.csv`);
                    it(`create cohort ${(3 * index) + 2} (limited count`, self.createCohortFn(store, cohortFilepath, true, searchCase.count));
                    it(`compare cohort ${(3 * index) + 2}`, self.compareExportToCohortFn(filepath, cohortFilepath, true));
                    it(`patch cohort ${(3 * index) + 2} (limited count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, true, searchCase.count));
                    it(`compare cohort ${(3 * index) + 2}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, true));
                    it(`patch filter ${index} for empty`, self.patchFilterFn(testCase0.emptyCase, store));
                    it(`patch cohort ${3 * index} filter edit (no count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, false));
                    it(`compare cohort ${3 * index} filter edit`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, false));
                    cohortId += 1;
                }
            });
            it('logout as super', self.shared.logoutFn());
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
