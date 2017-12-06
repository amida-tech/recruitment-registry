/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const surveyCommon = require('./util/survey-common');
const example = require('./fixtures/example/survey');

describe('answer integration', () => {
    const generator = new Generator();
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, generator);

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();

    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(2).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    it('create text only survey', surveyTests.createSurveyFn({ survey: example.textOnlySurvey }));
    it('get text only survey', surveyTests.getSurveyFn());
    it('logout as super', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    [' ', '\nxdxx', ' ddde', 'ssss ', '  yryryhh'].forEach((textValue) => {
        it(`error: bad whitespace text value ('${textValue}')`, function errorWhitespace() {
            const survey = hxSurvey.lastServer();
            const body = {
                surveyId: survey.id,
                answers: surveyCommon.formAnswersToPost(survey, [{ textValue }]),
            };
            return rrSuperTest.post('/answers', body, 400);
        });
    });
    it('sanity check good whitespace text value (\'a\')', function goodWhitespace() {
        const survey = hxSurvey.lastServer();
        const body = {
            surveyId: survey.id,
            answers: surveyCommon.formAnswersToPost(survey, [{ textValue: 'a' }]),
        };
        return rrSuperTest.post('/answers', body, 204);
    });
    it('logout as  user 1', shared.logoutFn());
});
