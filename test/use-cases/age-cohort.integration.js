/* global describe,before,it */

'use strict';

/* eslint max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const Generator = require('../util/generator');
const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const History = require('../util/history');
const SurveyHistory = require('../util/survey-history');
const surveyCommon = require('../util/survey-common');
const filterCommon = require('../util/filter-common');
const exampleSurveys = require('../fixtures/example/survey');

const config = require('../../config');

const expect = chai.expect;

describe('age cohort', function ageCohort() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest);

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();
    const birthYears = [];
    const boolAnswers = [];

    const surveyTests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey, hxQuestion);
    const filterTests = new filterCommon.IntegrationTests(rrSuperTest, hxQuestion);

    before(shared.setUpFn());

    it('login as super user', shared.loginFn(config.superUser));

    it('create profile survey', shared.createSurveyProfileFn(exampleSurveys.zipYOBProfileSurvey));

    it('create boolean only survey', surveyTests.createSurveyFn({ survey: exampleSurveys.booleanOnly }));
    it('get boolean only survey', surveyTests.getSurveyFn(0));

    it('logout as super user', shared.logoutFn());

    let birthYearId;
    let zipId;
    it('get profile survey', function getProfileSurvey() {
        return rrSuperTest.get('/profile-survey', false, 200)
            .then((res) => {
                const profileSurvey = res.body.survey;
                [zipId, birthYearId] = _.map(profileSurvey.questions, 'id');
            });
    });

    [true, false].forEach((boolValue) => {
        _.range(20).forEach((index) => {
            it(`register user ${index}`, function registerUser() {
                const user = generator.newUser();
                const birthYear = (2020 - 90) + (index * 2);
                const answers = [{
                    questionId: birthYearId,
                    answer: { yearValue: `${birthYear}` },
                }, {
                    questionId: zipId,
                    answer: { textValue: `${20850 + index}` },
                }];
                return rrSuperTest.authPost('/profiles', { user, answers }, 201)
                    .then((res) => {
                        hxUser.push(user, res.body);
                        birthYears.push(birthYear);
                        boolAnswers.push(boolValue);
                    });
            });

            it(`user ${index} answers boolean only survey`, function answerBooleanOnly() {
                const survey = hxSurvey.server(0);
                const questionId = survey.questions[0].id;
                const answers = {
                    surveyId: survey.id,
                    answers: [{ questionId, answer: { boolValue } }],
                };
                return rrSuperTest.post('/answers', answers, 204);
            });

            it(`logout as user ${index}`, shared.logoutFn());
        });
    });

    it('login as super user', shared.loginFn(config.superUser));

    [[1940, 1960], [null, 1960], [1960, null], [1950, 1960]].forEach(([min, max], caseIndex) => {
        let filterQuestions;

        it(`search users case ${caseIndex}`, function searchUsers() {
            const questionId = hxSurvey.server(0).questions[0].id;
            const boolValue = (caseIndex % 2) === 0;
            const questions = [{
                id: birthYearId,
                answers: [{
                    yearRange: {},
                }],
            }, {
                id: questionId,
                answers: [{ boolValue }],
            }];
            if (min) {
                questions[0].answers[0].yearRange.min = `${min}`;
            }
            if (max) {
                questions[0].answers[0].yearRange.max = `${max}`;
            }
            filterQuestions = questions;
            return rrSuperTest.post('/answers/user-ids', { questions }, 200)
                .then(res => _.sortBy(res.body, 'userId'))
                .then((userIds) => {
                    const expected = birthYears.reduce((r, birthYear, index) => {
                        if (boolValue !== boolAnswers[index]) {
                            return r;
                        }
                        if (min && (birthYear <= min)) {
                            return r;
                        }
                        if (max && (birthYear >= max)) {
                            return r;
                        }
                        r.push({ userId: hxUser.id(index) });
                        return r;
                    }, []);
                    expect(userIds).to.deep.equal(expected);
                });
        });

        it(`create filter that can be used for cohorts ${caseIndex}`, function createFilter() {
            const options = {
                filter: {
                    name: `filter_${caseIndex}`,
                    questions: filterQuestions,
                },
            };
            return filterTests.createFilterFn(options)();
        });

        it(`get/verify filter that can be used for cohorts ${caseIndex}`, function getFilter() {
            return filterTests.getFilterFn(caseIndex)();
        });
    });

    it('logout as super user', shared.logoutFn());
});

