/* global describe, it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const path = require('path');
const fs = require('fs');
const chai = require('chai');
const _ = require('lodash');
const intoStream = require('into-stream');
const mkdirp = require('mkdirp');
const sinon = require('sinon');

const config = require('../../../config');
const csvEmailUtil = require('../../../lib/csv-email-util');
const smtpHelper = require('../../../lib/smtp-helper');
const SPromise = require('../../../lib/promise');

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
    integer(questionId, spec) {
        return { answer: { integerValue: spec.value } };
    },
    date(questionId, spec) {
        return { answer: { dateValue: spec.value } };
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
    $idProperty: 'questionId',
};

const filterAnswerGenerators = Object.assign(Object.create(answerGenerators), {
    choices(questionId, spec, choiceIdMap) {
        const choiceIds = choiceIdMap.get(questionId);
        const answers = spec.choiceIndices.map((choiceIndex) => {
            const result = { choice: choiceIds[choiceIndex] };
            if (!spec.ignoreBoolValue) {
                result.boolValue = true;
            }
            return result;
        });
        return { answers };
    },
    integer(questionId, spec) {
        if (spec.rangeValue) {
            return { answer: { integerRange: spec.rangeValue } };
        }
        return { answer: { integerValue: spec.value } };
    },
    date(questionId, spec) {
        if (spec.rangeValue) {
            return { answer: { dateRange: spec.rangeValue } };
        }
        return { answer: { dateValue: spec.value } };
    },
    $idProperty: 'id',
});

const federatedAnswerGenerators = {
    text(question, spec) {
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        return [{ identifier, questionText, textValue: spec.value }];
    },
    bool(question, spec) {
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        return [{ identifier, questionText, boolValue: spec.value }];
    },
    integer(question, spec) {
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        if (spec.rangeValue) {
            return [{ identifier, questionText, integerRange: spec.rangeValue }];
        }
        return [{ identifier, questionText, integerValue: spec.value }];
    },
    date(question, spec) {
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        if (spec.rangeValue) {
            return [{ identifier, questionText, dateRange: spec.rangeValue }];
        }
        return [{ identifier, questionText, dateValue: spec.value }];
    },
    choice(question, spec) {
        const choice = question.choices[spec.choiceIndex];
        const identifier = choice.identifier;
        const questionChoiceText = choice.text;
        const questionText = question.text;
        return [{ identifier, questionText, questionChoiceText }];
    },
    choices(question, spec) {
        const questionText = question.text;
        const identifiers = spec.choiceIndices.map((choiceIndex) => {
            const choice = question.choices[choiceIndex];
            const identifier = choice.identifier;
            const questionChoiceText = choice.text;
            return { identifier, questionText, questionChoiceText, boolValue: true };
        });
        return identifiers;
    },
    multitext(question, spec) {
        const values = spec.values;
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        const fn = textValue => ({ identifier, textValue, questionText });
        return values.map(fn);
    },
    multibool(question, spec) {
        const values = spec.values;
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        const fn = boolValue => ({ identifier, boolValue, questionText });
        return values.map(fn);
    },
    multichoice(question, spec) {
        const questionText = question.text;
        const identifiers = spec.choiceIndices.map((choiceIndex) => {
            const choice = question.choices[choiceIndex];
            const identifier = choice.identifier;
            const questionChoiceText = choice.text;
            return { identifier, questionText, questionChoiceText };
        });
        return identifiers;
    },
};

const federatedAnswerListGenerators = {
    text(question, spec) {
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        return [{ identifier, questionText, value: spec.value }];
    },
    integer(question, spec) {
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        return [{ identifier, questionText, value: spec.value.toString() }];
    },
    date(question, spec) {
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        return [{ identifier, questionText, value: spec.value }];
    },
    bool(question, spec) {
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        return [{ identifier, questionText, value: spec.value ? 'true' : 'false' }];
    },
    choice(question, spec) {
        const choice = question.choices[spec.choiceIndex];
        const identifier = choice.identifier;
        const questionChoiceText = choice.text;
        const questionText = question.text;
        return [{ identifier, questionText, questionChoiceText }];
    },
    choices(question, spec) {
        const questionText = question.text;
        const identifiers = spec.choiceIndices.map((choiceIndex) => {
            const choice = question.choices[choiceIndex];
            const identifier = choice.identifier;
            const questionChoiceText = choice.text;
            return { identifier, questionText, questionChoiceText, value: 'true' };
        });
        return identifiers;
    },
    multitext(question, spec) {
        const values = spec.values;
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        const fn = textValue => ({ identifier, value: textValue, questionText });
        return values.map(fn);
    },
    multibool(question, spec) {
        const values = spec.values;
        const identifier = question.answerIdentifier;
        const questionText = question.text;
        const fn = boolValue => ({ identifier, value: boolValue ? 'true' : 'false', questionText });
        return values.map(fn);
    },
    multichoice(question, spec) {
        const questionText = question.text;
        const identifiers = spec.choiceIndices.map((choiceIndex) => {
            const choice = question.choices[choiceIndex];
            const identifier = choice.identifier;
            const questionChoiceText = choice.text;
            return { identifier, questionText, questionChoiceText };
        });
        return identifiers;
    },
};

const Tests = class BaseTests {
    constructor(options = {}) {
        this.offset = options.offset || 5;
        this.surveyCount = options.surveyCount || 6;
        this.userCount = 6;
        this.noSync = options.noSync;

        const hxUser = new History();
        const hxSurvey = new SurveyHistory();
        const hxQuestion = new History();

        this.hxUser = hxUser;
        this.hxSurvey = hxSurvey;
        this.hxQuestion = hxQuestion;

        this.surveyGenerator = new SurveyGenerator();

        const typeIndexMap = new Map();
        const types = [];
        const questions = [];
        let addIdentifier = true;
        const questionGenerator = new QuestionGenerator();
        ['choice', 'choices', 'text', 'bool', 'integer', 'date'].forEach((type) => {
            const opt = { type, choiceCount: 6, noText: true, noOneOf: true };
            types.push(type);
            const indices = [];
            typeIndexMap.set(type, indices);
            _.range(this.surveyCount).forEach((index) => {
                indices.push(this.offset + questions.length);
                if (addIdentifier) {
                    opt.identifiers = {
                        type: 'federated',
                        postfix: `survey_${index}_${type}`,
                    };
                } else {
                    delete opt.identifiers;
                }
                addIdentifier = !addIdentifier;
                const question = questionGenerator.newQuestion(opt);
                questions.push(question);
            });
        });
        const multiQuestionGenerator = new MultiQuestionGenerator(questionGenerator);
        ['choice', 'text', 'bool'].forEach((type) => {
            const opt = { type, choiceCount: 6, noOneOf: true, max: 5 };
            const multiType = `multi${type}`;
            types.push(multiType);
            const indices = [];
            typeIndexMap.set(multiType, indices);
            _.range(this.surveyCount).forEach((index) => {
                if (addIdentifier) {
                    opt.identifiers = {
                        type: 'federated',
                        postfix: `survey_${index}_${multiType}`,
                    };
                } else {
                    delete opt.identifiers;
                }
                addIdentifier = !addIdentifier;
                indices.push(this.offset + questions.length);
                const question = multiQuestionGenerator.newMultiQuestion(opt);
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

    answerInfoToObject(surveyIndex, answerInfo, forFilter) {
        return answerInfo.map((info) => {
            const questionType = info.questionType;
            const questionIndex = this.typeIndexMap.get(questionType)[surveyIndex];
            const questionId = this.hxQuestion.id(questionIndex);
            const generators = forFilter ? filterAnswerGenerators : answerGenerators;
            const answerGenerator = generators[questionType];
            const answerObject = answerGenerator(questionId, info, this.choiceIdMap);
            const idProperty = generators.$idProperty;
            if (forFilter && info.exclude) {
                answerObject.exclude = true;
            }
            return Object.assign({ [idProperty]: questionId }, answerObject);
        });
    }

    answerInfoToFederatedObject(surveyIndex, answerInfo) {
        return answerInfo.map((info) => {
            const questionType = info.questionType;
            const questionIndex = this.typeIndexMap.get(questionType)[surveyIndex];
            const question = this.hxQuestion.server(questionIndex);
            const answerGenerator = federatedAnswerGenerators[questionType];
            const answerObject = answerGenerator(question, info);
            if (info.exclude) {
                answerObject.forEach((r) => { r.exclude = true; });
            }
            return answerObject;
        });
    }

    answerInfoToFederatedListObject(surveyIndex, answerInfo) {
        return answerInfo.map((info) => {
            const questionType = info.questionType;
            const questionIndex = this.typeIndexMap.get(questionType)[surveyIndex];
            const question = this.hxQuestion.server(questionIndex);
            const answerGenerator = federatedAnswerListGenerators[questionType];
            const answerObject = answerGenerator(question, info);
            answerObject.forEach((r) => {
                if (!r.identifier) {
                    delete r.identifier;
                }
            });
            return answerObject;
        });
    }

    getCase(index) { // eslint-disable-line class-methods-use-this
        return testCase0.searchCases[index];
    }

    formCriteria(inputAnswers) {
        const rawQuestions = inputAnswers.reduce((r, { surveyIndex, answerInfo }) => {
            const answers = this.answerInfoToObject(surveyIndex, answerInfo, true);
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
        rawQuestions.forEach(({ exclude }, index) => {
            if (exclude) {
                questions[index].exclude = true;
            }
        });
        return { questions };
    }

    formFederatedCriteria(inputAnswers) {
        return inputAnswers.reduce((r, { surveyIndex, answerInfo }) => {
            const answers = this.answerInfoToFederatedObject(surveyIndex, answerInfo);
            answers.forEach(answer => r.push(...answer));
            return r;
        }, []);
    }

    getCriteria(index) {
        const { count, answers } = this.getCase(index);
        const criteria = this.formCriteria(answers);
        return { count, criteria };
    }

    getFederatedCriteria(index) {
        const { count, answers } = this.getCase(index);
        const federatedCriteria = this.formFederatedCriteria(answers);
        return { count, federatedCriteria };
    }

    countParticipantsFn({ count, answers }) {
        const self = this;
        return function searchAnswerCount() {
            const criteria = self.formCriteria(answers);
            return self.countParticipantsPx(criteria)
                .then(({ count: actual }) => expect(actual).to.equal(count));
        };
    }

    countParticipantsIdentifiersFn({ count, answers }) {
        const self = this;
        return function countParticipantsIdentifierst() {
            const criteria = self.formFederatedCriteria(answers);
            return self.countParticipantsIdentifiersPx(criteria)
                .then(({ count: actual }) => expect(actual).to.equal(count));
        };
    }

    searchParticipantsFn({ userIndices, answers }) {
        const self = this;
        return function searchParticipants() {
            const criteria = self.formCriteria(answers);
            return self.searchParticipantsPx(criteria)
                .then((userIds) => {
                    const actual = userIds.map(({ userId }) => userId);
                    const expected = userIndices.map(index => self.hxUser.id(index));
                    expect(actual).to.deep.equal(expected);
                });
        };
    }

    searchParticipantsIdentifiersFn({ userIndices, answers }) {
        const self = this;
        return function searchParticipantsIdentifiers() {
            const criteria = self.formFederatedCriteria(answers);
            return self.searchParticipantsIdentifiersPx(criteria)
                .then((userIds) => {
                    const actual = userIds.map(({ userId }) => userId);
                    const expected = userIndices.map(index => self.hxUser.id(index));
                    expect(actual).to.deep.equal(expected);
                });
        };
    }

    federatedListAnswersExpected(answerSequence, userIndices) {
        const userIndexSet = new Set(userIndices);
        return answerSequence.reduce((r, { userIndex, surveyIndex, answerInfo }) => {
            if (!userIndexSet.has(userIndex)) {
                return r;
            }
            const userId = this.hxUser.id(userIndex);
            const answers = this.answerInfoToFederatedListObject(surveyIndex, answerInfo);
            const flattenedAnswers = _.flatten(answers);
            flattenedAnswers.forEach((p) => { p.userId = userId; });
            r.push(...flattenedAnswers);
            return r;
        }, []);
    }

    federatedListAnswersFn({ userIndices, answers }, answerSequence) {
        const fields = ['userId', 'questionText', 'questionChoiceText', 'identifier', 'value'];
        const self = this;
        return function federatedListAnswers() {
            const criteria = self.formFederatedCriteria(answers);
            return self.federatedListAnswersPx(criteria)
                .then((rawRecords) => {
                    const expectedRaw = self.federatedListAnswersExpected(answerSequence, userIndices);
                    const expected = _.sortBy(expectedRaw, fields);
                    const records = _.sortBy(rawRecords, fields);
                    expect(records).to.deep.equal(expected);
                });
        };
    }
};

const SpecTests = class SearchSpecTests extends Tests {
    constructor(inputModels, options) {
        super(options);
        this.models = inputModels || models;
        const generator = new Generator();

        this.shared = new SharedSpec(generator, this.models);
        this.answerTests = new answerCommon.SpecTests(generator, this);
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

    countParticipantsPx(criteria) {
        const m = this.models;
        return m.answer.countParticipants(criteria);
    }

    countParticipantsIdentifiersPx(criteria) {
        const m = this.models;
        return m.answer.countParticipantsIdentifiers(criteria);
    }

    searchParticipantsPx(criteria) {
        const m = this.models;
        return m.answer.searchParticipants(criteria);
    }

    searchParticipantsIdentifiersPx(criteria) {
        const m = this.models;
        return m.answer.searchParticipantsIdentifiers(criteria);
    }

    federatedListAnswersPx(federatedCriteria) {
        const m = this.models;
        return m.answer.federatedListAnswers(federatedCriteria);
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
            return m.answer.countParticipants({})
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
            const answers = self.answerInfoToObject(surveyIndex, answerInfo, false);
            const input = { userId, surveyId, answers };
            return m.answer.createAnswers(input)
                .then(() => hxAnswers.push(userIndex, surveyIndex, answers));
        };
    }

    compareExportToCohortFn(store, limit) { // eslint-disable-line class-methods-use-this
        const sortFields = ['userId', 'surveyId', 'questionId', 'questionChoiceId', 'value'];
        return function compareExportToCohort() {
            const converter = new ImportCSVConverter({ checkType: false });
            const streamFullExport = intoStream(store.allContent);
            return converter.streamToRecords(streamFullExport)
                .then((recordsFullExportRaw) => {
                    const recordsFullExport = _.sortBy(recordsFullExportRaw, sortFields);
                    const streamCohort = intoStream(store.cohort);
                    return converter.streamToRecords(streamCohort)
                        .then((recordsCohortRaw) => {
                            const recordsCohort = _.sortBy(recordsCohortRaw, sortFields);
                            expect(recordsCohort.length).to.be.above(0);
                            if (limit) {
                                const userIdSet = new Set(recordsCohort.map(r => r.userId));
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

    createCohortFn(store, options) {
        const m = this.models;
        const { limited, userCount, localFederated, federated } = options;
        return function createCohort() {
            const count = limited ? userCount - 1 : 10000;
            const newCohort = { filterId: store.id, count };
            if (localFederated) {
                newCohort.local = true;
                newCohort.federated = true;
            }
            if (federated) {
                newCohort.federated = true;
            }
            return m.cohort.createCohort(newCohort, options.federatedModels)
                .then((result) => { store.cohort = result; });
        };
    }

    patchCohortFn(id, store, options) {
        const m = this.models;
        const { limited, userCount } = options;
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
            const filter = { name: `name_${index}` };
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
        const qxTests = self.questionTests;
        return function answerSearchUnit() {
            describe('system setup', function systemSetup() {
                if (!self.noSync) {
                    it('sync models', self.shared.setUpFn());
                }
            });

            describe('create users/questions', function createUsersQuestions() {
                _.range(6).forEach((index) => {
                    it(`create user ${index}`, self.shared.createUserFn(self.hxUser));
                });

                _.range(self.offset).forEach((index) => {
                    it(`create question ${index}`, qxTests.createQuestionFn());
                    it(`get question ${index}`, qxTests.getQuestionFn(index));
                });

                self.questions.forEach((question, index) => {
                    const actualIndex = self.offset + index;
                    it(`create question ${actualIndex}`, qxTests.createQuestionFn({ question }));
                    it(`get question ${actualIndex}`, qxTests.getQuestionFn(actualIndex, { federated: true }, { ignoreQuestionIdentifier: true }));
                });

                it('create question choice map', self.generateChoiceMapFn());

                _.range(self.surveyCount).forEach((index) => {
                    const qxIndices = self.types.map(type => self.typeIndexMap.get(type)[index]);
                    it(`create survey ${index}`, self.createSurveyFn(qxIndices));
                });
            });

            describe('criteria to federated criteria', function criteriaConversions() {
                const searchCases = testCase0.searchCases;
                searchCases.forEach((searchCase, index) => {
                    it(`criteria ${index}`, function criteriaConversion() {
                        const answerDao = self.models.answer;
                        const c = self.formCriteria(searchCase.answers);
                        return answerDao.localCriteriaToFederatedCriteria(c)
                            .then(f => answerDao.federatedCriteriaToLocalCriteria(f))
                            .then((actual) => {
                                expect(actual).to.deep.equal(c);
                            });
                    });
                });
            });

            describe('create answers', function createAnswers() {
                const answerSequence = testCase0.answerSequence;

                answerSequence.forEach(({ userIndex, surveyIndex, answerInfo }) => {
                    const msg = `user ${userIndex} answers survey ${surveyIndex}`;
                    it(msg, self.createAnswersFn(userIndex, surveyIndex, answerInfo));
                });
            });

            describe('search participants/answers (local filters)', function searchAnswersLocal() {
                const searchCases = testCase0.searchCases;

                it('search empty criteria', self.searchEmptyFn(self.userCount));

                let cohortId = 1;
                const caseLen = 6;
                searchCases.forEach((searchCase, index) => {
                    it(`search case ${index} count`, self.countParticipantsFn(searchCase));
                    it(`search case ${index} user ids`, self.searchParticipantsFn(searchCase));

                    if (searchCase.count > 1) {
                        const store = {};
                        let cohortIndex;
                        let cohortOptions;

                        it(`search case ${index} export answers`, self.exportAnswersForUsersFn(searchCase, store));
                        it(`create filter ${index}`, self.createFilterFn(index, searchCase, store));

                        cohortIndex = caseLen * index;
                        cohortOptions = { limited: false };
                        it(`create cohort ${cohortIndex} (no count)`, self.createCohortFn(store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, false));
                        it(`patch cohort ${cohortIndex} (no count)`, self.patchCohortFn(cohortId, store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, false));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 1;
                        cohortOptions = { limited: true, userCount: 10000 };
                        it(`create cohort ${cohortIndex} (large count)`, self.createCohortFn(store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, false));
                        it(`patch cohort ${cohortIndex} (large count)`, self.patchCohortFn(cohortId, store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, false));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 2;
                        cohortOptions = { limited: true, userCount: searchCase.count };
                        it(`create cohort ${cohortIndex} (limited count`, self.createCohortFn(store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, true));
                        it(`patch cohort ${cohortIndex} (limited count)`, self.patchCohortFn(cohortId, store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, true));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 3;
                        cohortOptions = { limited: false, localFederated: true };
                        it(`create cohort ${cohortIndex} (no count)`, self.createCohortFn(store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, false));
                        it(`patch cohort ${cohortIndex} (no count)`, self.patchCohortFn(cohortId, store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, false));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 4;
                        cohortOptions = { limited: true, userCount: 10000, localFederated: true };
                        it(`create cohort ${cohortIndex} (large count)`, self.createCohortFn(store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, false));
                        it(`patch cohort ${cohortIndex} (large count)`, self.patchCohortFn(cohortId, store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, false));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 5;
                        cohortOptions = { limited: true, userCount: searchCase.count, localFederated: true };
                        it(`create cohort ${cohortIndex} (limited count`, self.createCohortFn(store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, true));
                        it(`patch cohort ${cohortIndex} (limited count)`, self.patchCohortFn(cohortId, store, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(store, true));
                        cohortId += 1;

                        it(`patch filter ${index} for empty`, self.patchFilterFn(testCase0.emptyCase, store));
                    }
                });
            });

            describe('search participants/answers (federated filters)', function searchWithIdentifiers() {
                const searchCases = testCase0.searchCases;

                searchCases.forEach((searchCase, index) => {
                    it(`search case ${index} count`, self.countParticipantsIdentifiersFn(searchCase));
                    it(`search case ${index} user ids`, self.searchParticipantsIdentifiersFn(searchCase));
                    it(`search case ${index} answers`, self.federatedListAnswersFn(searchCase, testCase0.answerSequence));
                });
            });
        };
    }
};

const IntegrationTests = class SearchIntegrationTests extends Tests {
    constructor(rrSuperTest, options) {
        super(options);
        this.rrSuperTest = rrSuperTest;
        const generator = new Generator();

        this.shared = new SharedIntegration(rrSuperTest, generator);
        this.answerTests = new answerCommon.IntegrationTests(rrSuperTest, this);
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

    countParticipantsPx(criteria) {
        const r = this.rrSuperTest;
        return r.post('/answers/queries', criteria, 200).then(res => res.body);
    }

    countParticipantsIdentifiersPx(criteria) {
        const r = this.rrSuperTest;
        return r.post('/answers/identifier-queries', criteria, 200).then(res => res.body);
    }

    searchParticipantsPx(criteria) {
        const r = this.rrSuperTest;
        return r.post('/answers/user-ids', criteria, 200).then(res => res.body);
    }

    searchParticipantsIdentifiersPx(criteria) {
        const r = this.rrSuperTest;
        return r.post('/answers/identifier-user-ids', criteria, 200).then(res => res.body);
    }

    federatedListAnswersPx(criteria) {
        const r = this.rrSuperTest;
        return r.post('/answers/federated', criteria, 200).then(res => res.body);
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

    searchEmptyFn(count) {
        const rrSuperTest = this.rrSuperTest;
        return function searchEmpty() {
            return rrSuperTest.post('/answers/queries', { questions: [] }, 200)
                .then(res => expect(res.body.count).to.equal(count));
        };
    }

    createAnswersFn(userIndex, surveyIndex, answerInfo) {
        const self = this;
        const hxSurvey = this.hxSurvey;
        const hxAnswers = this.hxAnswers;
        const rrSuperTest = this.rrSuperTest;
        return function createAnswers() {
            const surveyId = hxSurvey.id(surveyIndex);
            const answers = self.answerInfoToObject(surveyIndex, answerInfo, false);
            const input = { surveyId, answers, language: 'en' };
            return rrSuperTest.post('/answers', input, 204)
                .expect(() => hxAnswers.push(userIndex, surveyIndex, answers));
        };
    }

    compareExportToCohortFn(filepath, cohortFilepath, limit) { // eslint-disable-line class-methods-use-this
        const sortFields = ['userId', 'surveyId', 'questionId', 'questionChoiceId', 'value'];
        return function compareExportToCohort() {
            const converter = new ImportCSVConverter({ checkType: false });
            const streamFullExport = fs.createReadStream(filepath);
            return converter.streamToRecords(streamFullExport)
                .then((recordsFullExportRaw) => {
                    const recordsFullExport = _.sortBy(recordsFullExportRaw, sortFields);
                    const streamCohort = fs.createReadStream(cohortFilepath);
                    return converter.streamToRecords(streamCohort)
                        .then((recordsCohortRaw) => {
                            const recordsCohort = _.sortBy(recordsCohortRaw, sortFields);
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

    createCohortFn(store, filepath, options) {
        const rrSuperTest = this.rrSuperTest;
        const { limited, userCount, localFederated, federated } = options;
        return function createCohort() {
            let csvText = '';
            sinon.stub(csvEmailUtil, 'uploadCohortCSV', (csv) => {
                csvText = csv;
                return SPromise.resolve({});
            });
            sinon.stub(smtpHelper, 'sendS3LinkEmail', () => SPromise.resolve({}));

            const count = limited ? userCount - 1 : 10000;
            const payload = { filterId: store.id, count };
            if (localFederated) {
                payload.local = true;
                payload.federated = true;
            }
            if (federated) {
                payload.federated = true;
            }
            return rrSuperTest.post('/cohorts', payload, 201)
                .then(() => {
                    fs.writeFileSync(filepath, csvText);
                    csvEmailUtil.uploadCohortCSV.restore();
                    smtpHelper.sendS3LinkEmail.restore();
                });
        };
    }

    patchCohortFn(id, store, filepath, options) {
        const rrSuperTest = this.rrSuperTest;
        const { limited, userCount } = options;
        return function createCohort() {
            let csvText = '';
            sinon.stub(csvEmailUtil, 'uploadCohortCSV', (csv) => {
                csvText = csv;
                return SPromise.resolve({});
            });
            sinon.stub(smtpHelper, 'sendS3LinkEmail', () => SPromise.resolve({}));

            const count = limited ? userCount - 1 : 10000;
            const payload = { count };
            return rrSuperTest.patch(`/cohorts/${id}`, payload, 200)
                .then(res => fs.writeFileSync(filepath, res.text))
                .then(() => {
                    fs.writeFileSync(filepath, csvText);
                    csvEmailUtil.uploadCohortCSV.restore();
                    smtpHelper.sendS3LinkEmail.restore();
                });
        };
    }

    createFilterFn(index, searchCase, store) {
        const self = this;
        const rrSuperTest = this.rrSuperTest;
        return function createFilter() {
            const filter = { name: `name_${index}` };
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
        const qxTests = self.questionTests;
        return function answerSearchIntegration() {
            const generatedDirectory = path.join(__dirname, '../../generated');

            describe('system setup', function systemSetup() {
                if (!self.noSync) {
                    it('sync models', self.shared.setUpFn());
                }

                it('create output directory if necessary', function mkdirpIfNecessary(done) {
                    mkdirp(generatedDirectory, done);
                });
            });

            describe('create users/questions', function createUsersQuestions() {
                it('login as super', self.shared.loginFn(config.superUser));

                _.range(self.userCount).forEach((index) => {
                    it(`create user ${index}`, self.shared.createUserFn(self.hxUser));
                });

                _.range(self.offset).forEach((index) => {
                    it(`create question ${index}`, qxTests.createQuestionFn());
                    it(`get question ${index}`, qxTests.getQuestionFn(index));
                });

                self.questions.forEach((question, ndx) => {
                    const index = self.offset + ndx;
                    const q = { question };
                    it(`create question ${index}`, qxTests.createQuestionFn(q));
                    const opt1 = { federated: true };
                    const opt2 = { ignoreQuestionIdentifier: true };
                    it(`get question ${index}`, qxTests.getQuestionFn(index, opt1, opt2));
                });

                it('create question choice map', self.generateChoiceMapFn());

                _.range(self.surveyCount).forEach((index) => {
                    const qxIndices = self.types.map(type => self.typeIndexMap.get(type)[index]);
                    it(`create survey ${index}`, self.createSurveyFn(qxIndices));
                });

                it('logout as super', self.shared.logoutFn());
            });

            describe('create answers', function createAnswers() {
                const answerSequence = testCase0.answerSequence;

                answerSequence.forEach(({ userIndex, surveyIndex, answerInfo }) => {
                    it(`login as user ${userIndex}`, self.shared.loginIndexFn(self.hxUser, userIndex));
                    const msg = `user ${userIndex} answers survey ${surveyIndex}`;
                    it(msg, self.createAnswersFn(userIndex, surveyIndex, answerInfo));
                    it(`logout as user ${userIndex}`, self.shared.logoutFn());
                });
            });

            describe('search participants/answers (local filters)', function searchWithDbIds() {
                it('login as super', self.shared.loginFn(config.superUser));

                it('search empty criteria', self.searchEmptyFn(self.userCount));

                const searchCases = testCase0.searchCases;

                let cohortId = 1;
                const caseLen = 6;
                searchCases.forEach((searchCase, index) => {
                    it(`search case ${index} count`, self.countParticipantsFn(searchCase));
                    it(`search case ${index} user ids`, self.searchParticipantsFn(searchCase));

                    if (searchCase.count > 1) {
                        const store = {};
                        let cohortFilepath;
                        let cohortPatchFilepath;
                        let cohortIndex;
                        let cohortOptions;

                        const filepath = path.join(generatedDirectory, `answer-multi_${index}.csv`);
                        it(`search case ${index} export answers`, self.exportAnswersForUsersFn(searchCase, filepath));
                        it(`create filter ${index}`, self.createFilterFn(index, searchCase, store));

                        cohortIndex = caseLen * index;
                        cohortFilepath = path.join(generatedDirectory, `cohort_${cohortIndex}.csv`);
                        cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${cohortIndex}.csv`);
                        cohortOptions = { limited: false };
                        it(`create cohort ${cohortIndex} (no count)`, self.createCohortFn(store, cohortFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortFilepath, false));
                        it(`patch cohort ${cohortIndex} (no count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, false));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 1;
                        cohortFilepath = path.join(generatedDirectory, `cohort_${cohortIndex}.csv`);
                        cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${cohortIndex}.csv`);
                        cohortOptions = { limited: true, userCount: 10000 };
                        it(`create cohort ${cohortIndex} (large count)`, self.createCohortFn(store, cohortFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortFilepath, false));
                        it(`patch cohort ${cohortIndex} (large count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, false));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 2;
                        cohortFilepath = path.join(generatedDirectory, `cohort_${cohortIndex}.csv`);
                        cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${cohortIndex}.csv`);
                        cohortOptions = { limited: true, userCount: searchCase.count };
                        it(`create cohort ${cohortIndex} (limited count`, self.createCohortFn(store, cohortFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortFilepath, true));
                        it(`patch cohort ${cohortIndex} (limited count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, true));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 3;
                        cohortFilepath = path.join(generatedDirectory, `cohort_${cohortIndex}.csv`);
                        cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${cohortIndex}.csv`);
                        cohortOptions = { limited: false, localFederated: true };
                        it(`create cohort ${cohortIndex} (no count)`, self.createCohortFn(store, cohortFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortFilepath, false));
                        it(`patch cohort ${cohortIndex} (no count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, false));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 4;
                        cohortFilepath = path.join(generatedDirectory, `cohort_${cohortIndex}.csv`);
                        cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${cohortIndex}.csv`);
                        cohortOptions = { limited: true, userCount: 10000, localFederated: true };
                        it(`create cohort ${cohortIndex} (large count)`, self.createCohortFn(store, cohortFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortFilepath, false));
                        it(`patch cohort ${cohortIndex} (large count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, false));
                        cohortId += 1;

                        cohortIndex = (caseLen * index) + 5;
                        cohortFilepath = path.join(generatedDirectory, `cohort_${cohortIndex}.csv`);
                        cohortPatchFilepath = path.join(generatedDirectory, `cohort_patch_${cohortIndex}.csv`);
                        cohortOptions = { limited: true, userCount: searchCase.count, localFederated: true };
                        it(`create cohort ${cohortIndex} (limited count`, self.createCohortFn(store, cohortFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortFilepath, true));
                        it(`patch cohort ${cohortIndex} (limited count)`, self.patchCohortFn(cohortId, store, cohortPatchFilepath, cohortOptions));
                        it(`compare cohort ${cohortIndex}`, self.compareExportToCohortFn(filepath, cohortPatchFilepath, true));
                        cohortId += 1;
                    }
                });

                it('logout as super', self.shared.logoutFn());
            });

            describe('search participants/answers (federated filters)', function searchWithIdentifiers() {
                it('login as super', self.shared.loginFn(config.superUser));

                it('search empty criteria', self.searchEmptyFn(self.userCount));

                const searchCases = testCase0.searchCases;

                searchCases.forEach((searchCase, index) => {
                    it(`search case ${index} count`, self.countParticipantsIdentifiersFn(searchCase));
                    it(`search case ${index} user ids`, self.searchParticipantsIdentifiersFn(searchCase));
                    it(`search case ${index} answers`, self.federatedListAnswersFn(searchCase, testCase0.answerSequence));
                });

                it('logout as super', self.shared.logoutFn());
            });
        };
    }
};

module.exports = {
    SpecTests,
    IntegrationTests,
};
