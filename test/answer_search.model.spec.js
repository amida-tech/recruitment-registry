/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const testCase0 = require('./util/search/test-case-0');
const searchCommon = require('./util/search/search-common');

describe('answer search unit', function answerSearchUnit() {
    const tests = new searchCommon.SpecTests();

    const shared = tests.shared;

    const hxUser = tests.hxUser;

    const questionTests = tests.questionTests;

    before(shared.setUpFn());

    _.range(5).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    _.range(tests.offset).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    tests.questions.forEach((question, index) => {
        const actualIndex = tests.offset + index;
        it(`create question ${actualIndex}`, questionTests.createQuestionFn(question));
        it(`get question ${actualIndex}`, questionTests.getQuestionFn(actualIndex));
    });

    it('create a map of all choice/choice question choices', tests.generateChoiceMapFn());

    _.range(tests.surveyCount).forEach((index) => {
        const qxIndices = tests.types.map(type => tests.typeIndexMap.get(type)[index]);
        it(`create survey ${index}`, tests.createSurveyFn(qxIndices));
    });

    const answerSequence = testCase0.answerSequence;

    answerSequence.forEach(({ userIndex, surveyIndex, answerInfo }) => {
        const msg = `user ${userIndex} answers survey ${surveyIndex}`;
        it(msg, tests.createAnswersFn(userIndex, surveyIndex, answerInfo));
    });

    const searchCases = testCase0.searchCases;

    searchCases.forEach((searchCase, index) => {
        it(`search case ${index}`, tests.searchAnswersFn(searchCase));
    });
});
