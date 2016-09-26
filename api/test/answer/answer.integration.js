/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../../config');

const shared = require('../shared-integration');
const answerCommon = require('./answer-common');

describe('answer integration', function () {
    const store = {
        users: [],
        questions: [],
        questionIds: [],
        qxChoices: [],
        surveys: [],
        surveyIds: [],
        hxAnswers: {}
    };

    before(shared.setUpFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 4; ++i) {
        it(`create user ${i}`, shared.createUserFn(store));
    }

    for (let i = 0; i < 20; ++i) {
        it(`create question ${i}`, shared.createQxFn(store));
        it(`fill choices ids in question ${i}`, shared.fillQxFn(store));
    }

    const testQuestions = answerCommon.testQuestions;

    _.map(testQuestions, 'survey').forEach((surveyQuestion, index) => {
        return it(`create survey ${index}`, shared.createSurveyFn(store, surveyQuestion));
    });

    it('logout as super', shared.logoutFn(store));
});
