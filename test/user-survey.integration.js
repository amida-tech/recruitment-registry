/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const SharedIntegration = require('./util/shared-integration');
const comparator = require('./util/comparator');
const translator = require('./util/translator');
const surveyCommon = require('./util/survey-common');

const expect = chai.expect;

describe('user survey integration', () => {
    const userCount = 3;
    const surveyCount = 3;

    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const mapAnswers = new Map();
    const mapStatus = new Map();
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey);

    before(shared.setUpFn());

    const getKey = function (userIndex, surveyIndex) {
        return `${userIndex}:${surveyIndex}`;
    };

    it('login as super', shared.loginFn(config.superUser));
    _.range(userCount).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });
    it('logout as super', shared.logoutFn());

    const verifyNoUserSurveysFn = function (done) {
        rrSuperTest.get('/user-surveys', true, 200)
            .expect((res) => {
                const userSurveys = res.body;
                expect(userSurveys.length).to.equal(0);
            })
            .end(done);
    };

    _.range(userCount).forEach((i) => {
        it(`login as user ${i}`, shared.loginIndexFn(hxUser, i));
        it(`verify no surveys for user ${i}`, verifyNoUserSurveysFn);
        it(`logout as user ${i}`, shared.logoutFn());
    });

    it('login as super', shared.loginFn(config.superUser));
    _.range(surveyCount).forEach((i) => {
        it(`create survey ${i}`, surveyTests.createSurveyFn({ noSection: true }));
        it(`get survey ${i}`, surveyTests.getSurveyFn(i));
    });
    it('logout as super', shared.logoutFn());

    const verifyStatusFn = function (surveyIndex, expectedStatus) {
        return function verifyStatus(done) {
            const surveyId = hxSurvey.id(surveyIndex);
            rrSuperTest.get(`/user-surveys/${surveyId}/status`, true, 200)
                .expect((res) => {
                    const status = res.body.status;
                    expect(status).to.equal(expectedStatus);
                })
                .end(done);
        };
    };

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('verify user 0 survey 0 status', verifyStatusFn(0, 'new'));
    it('verify user 0 survey 1 status', verifyStatusFn(1, 'new'));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('verify user 1 survey 0 status', verifyStatusFn(0, 'new'));
    it('verify user 1 survey 1 status', verifyStatusFn(1, 'new'));
    it('logout as user 1', shared.logoutFn());

    const verifyUserSurveyListFn = function (statusList) {
        return function verifyUserSurveyList(done) {
            rrSuperTest.get('/user-surveys', true, 200)
                .expect((res) => {
                    const userSurveys = res.body;
                    const expected = _.cloneDeep(hxSurvey.listServers());
                    expected.forEach((userSurvey, index) => {
                        userSurvey.status = statusList[index];
                        if (userSurvey.description === undefined) {
                            delete userSurvey.description;
                        }
                    });
                    expect(userSurveys).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('verify user 0 user survey list', verifyUserSurveyListFn(['new', 'new', 'new']));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('verify user 1 user survey list', verifyUserSurveyListFn(['new', 'new', 'new']));
    it('logout as user 1', shared.logoutFn());

    const verifyUserSurveyFn = function (userIndex, surveyIndex, status) {
        return function verifyUserSurvey(done) {
            const surveyId = hxSurvey.id(surveyIndex);
            rrSuperTest.get(`/user-surveys/${surveyId}`, true, 200)
                .expect((res) => {
                    const userSurvey = res.body;
                    const survey = hxSurvey.server(surveyIndex);
                    const key = getKey(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurvey.status).to.equal(status);
                    comparator.answeredSurvey(survey, answers, userSurvey.survey);
                })
                .end(done);
        };
    };

    const verifyUserSurveyAnswersFn = function (userIndex, surveyIndex, status, includeSurvey) {
        return function verifyUserSurveyAnswers(done) {
            const surveyId = hxSurvey.id(surveyIndex);
            const query = {};
            if (includeSurvey) {
                query['include-survey'] = true;
            }
            rrSuperTest.get(`/user-surveys/${surveyId}/answers`, true, 200, query)
                .expect((res) => {
                    const userSurveyAnswers = res.body;
                    if (includeSurvey) {
                        const survey = hxSurvey.server(surveyIndex);
                        expect(userSurveyAnswers.survey).to.deep.equal(survey);
                    } else {
                        expect(userSurveyAnswers.survey).to.equal(undefined);
                    }
                    const key = getKey(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurveyAnswers.status).to.equal(status);
                    comparator.answers(answers, userSurveyAnswers.answers);
                })
                .end(done);
        };
    };

    const answerSurveyFullFn = function (userIndex, surveyIndex, status) {
        return function answerSurveyFull(done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                answers,
                status,
            };
            const key = getKey(userIndex, surveyIndex);
            rrSuperTest.post(`/user-surveys/${survey.id}/answers`, input, 204)
                .expect(() => {
                    mapAnswers.set(key, answers);
                    mapStatus.set(key, status);
                })
                .end(done);
        };
    };

    const answerSurveyPartialFn = function (userIndex, surveyIndex) {
        return function answerSurveyFull(done) {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'in-progress',
            };
            const key = getKey(userIndex, surveyIndex);
            rrSuperTest.post(`/user-surveys/${survey.id}/answers`, input, 204)
                .expect(() => {
                    mapAnswers.set(key, answers);
                    mapStatus.set(key, 'in-progress');
                })
                .end(done);
        };
    };

    const answerSurveyMissingPlusCompletedFn = function (userIndex, surveyIndex) {
        return function answerSurveyMissingPlusCompleted(done) {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const notRequiredQuestions = survey.questions.filter(question => !question.required);
            expect(notRequiredQuestions).to.have.length.above(0);
            const questions = [...requiredQuestions, notRequiredQuestions[0]];
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'completed',
            };
            const key = getKey(userIndex, surveyIndex);
            rrSuperTest.post(`/user-surveys/${survey.id}/answers`, input, 204)
                .expect(() => {
                    const qxIdsNewlyAnswered = new Set(answers.map(answer => answer.questionId));
                    const previousAnswers = mapAnswers.get(key, answers).filter(answer => !qxIdsNewlyAnswered.has(answer.questionId));
                    mapAnswers.set(key, [...previousAnswers, ...answers]);
                    mapStatus.set(key, 'completed');
                })
                .end(done);
        };
    };

    const answerSurveyPartialCompletedFn = function (userIndex, surveyIndex) {
        return function answerSurveyPartialCompleted(done) {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'completed',
            };
            rrSuperTest.post(`/user-surveys/${survey.id}/answers`, input, 400)
                .expect(res => shared.verifyErrorMessage(res, 'answerRequiredMissing'))
                .end(done);
        };
    };

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('verify user 0 survey 0', verifyUserSurveyFn(0, 0, 'new'));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'new'));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('verify user 1 survey 0', verifyUserSurveyFn(1, 0, 'new'));
    it('verify user 1 survey 1', verifyUserSurveyFn(1, 1, 'new'));
    it('logout as user 1', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('verify user 0 survey 0 answers', verifyUserSurveyAnswersFn(0, 0, 'new'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'new'));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('verify user 1 survey 0 answers', verifyUserSurveyAnswersFn(1, 0, 'new'));
    it('verify user 1 survey 1 answers', verifyUserSurveyAnswersFn(1, 1, 'new'));
    it('logout as user 1', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('verify user 0 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(0, 0, 'new', true));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'new', true));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('verify user 1 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(1, 0, 'new', true));
    it('verify user 1 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(1, 1, 'new', true));
    it('logout as user 1', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 answers survey 0 all completed', answerSurveyFullFn(0, 0, 'completed'));
    it('verify user 0 survey 0', verifyUserSurveyFn(0, 0, 'completed'));
    it('verify user 0 survey 0 status', verifyStatusFn(0, 'completed'));
    it('verify user 0 survey 0 answers', verifyUserSurveyAnswersFn(0, 0, 'completed'));
    it('verify user 0 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(0, 0, 'completed', true));
    it('verify user 0 user survey list', verifyUserSurveyListFn(['completed', 'new', 'new']));
    it('logout as user 0', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 answers survey 1 all in-progress', answerSurveyFullFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1', verifyUserSurveyFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 status', verifyStatusFn(1, 'in-progress'));
    it('verify user 1 survey 1 answers', verifyUserSurveyAnswersFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(1, 1, 'in-progress', true));
    it('verify user 1 user survey list', verifyUserSurveyListFn(['new', 'in-progress', 'new']));
    it('logout as user 1', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 reanswers survey 1 all in-progress', answerSurveyFullFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1', verifyUserSurveyFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 status', verifyStatusFn(1, 'in-progress'));
    it('verify user 1 survey 1 answers', verifyUserSurveyAnswersFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(1, 1, 'in-progress', true));
    it('verify user 1 user survey list', verifyUserSurveyListFn(['new', 'in-progress', 'new']));
    it('logout as user 1', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 answers survey 1 partial in-progress', answerSurveyPartialFn(0, 1));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'in-progress'));
    it('verify user 0 survey 1 status', verifyStatusFn(1, 'in-progress'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'in-progress'));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'in-progress', true));
    it('verify user 0 user survey list', verifyUserSurveyListFn(['completed', 'in-progress', 'new']));
    it('logout as user 0', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(hxUser, 1));
    it('user 1 answers survey 0 partial completed', answerSurveyPartialCompletedFn(1, 0));
    it('verify user 1 survey 0', verifyUserSurveyFn(1, 0, 'new'));
    it('verify user 1 survey 0 status', verifyStatusFn(0, 'new'));
    it('verify user 1 survey 0 answers', verifyUserSurveyAnswersFn(1, 0, 'new'));
    it('verify user 1 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(1, 0, 'new', true));
    it('verify user 1 user survey list', verifyUserSurveyListFn(['new', 'in-progress', 'new']));
    it('logout as user 1', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(hxUser, 0));
    it('user 0 reanswers survey 1 required plus completed', answerSurveyMissingPlusCompletedFn(0, 1));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'completed'));
    it('verify user 0 survey 1 status', verifyStatusFn(1, 'completed'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'completed'));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'completed', true));
    it('verify user 0 user survey list', verifyUserSurveyListFn(['completed', 'completed', 'new']));
    it('logout as user 0', shared.logoutFn());

    const verifyTranslatedUserSurveyListFn = function (userIndex, statusList, language, notTranslated) {
        return function verifyTranslatedUserSurveyList(done) {
            rrSuperTest.get('/user-surveys', true, 200, { language })
                .expect((res) => {
                    const userSurveys = res.body;
                    if (!notTranslated) {
                        translator.isSurveyListTranslated(userSurveys, language);
                    }
                    const list = hxSurvey.listTranslatedServers(language);
                    const expected = _.cloneDeep(list);
                    expected.forEach((userSurvey, index) => {
                        userSurvey.status = statusList[index];
                        if (userSurvey.description === undefined) {
                            delete userSurvey.description;
                        }
                    });
                    expect(userSurveys).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const verifyTranslatedUserSurveyFn = function (userIndex, surveyIndex, status, language, notTranslated) {
        return function verifyTranslatedUserSurvey(done) {
            const surveyId = hxSurvey.id(surveyIndex);
            rrSuperTest.get(`/user-surveys/${surveyId}`, true, 200, { language })
                .expect((res) => {
                    const userSurvey = res.body;
                    const survey = hxSurvey.translatedServer(surveyIndex, language);
                    if (!notTranslated) {
                        translator.isSurveyTranslated(userSurvey.survey, language);
                    }
                    const key = getKey(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurvey.status).to.equal(status);
                    comparator.answeredSurvey(survey, answers, userSurvey.survey);
                })
                .end(done);
        };
    };

    const verifyTranslatedUserSurveyAnswersFn = function (userIndex, surveyIndex, status, language, notTranslated) {
        return function verifyTranslatedUserSurveyAnswers(done) {
            const surveyId = hxSurvey.id(surveyIndex);
            const query = { 'include-survey': true, language };
            rrSuperTest.get(`/user-surveys/${surveyId}/answers`, true, 200, query)
                .expect((res) => {
                    const userSurveyAnswers = res.body;
                    const survey = hxSurvey.translatedServer(surveyIndex, language);
                    if (!notTranslated) {
                        translator.isSurveyTranslated(userSurveyAnswers.survey, language);
                    }
                    expect(userSurveyAnswers.survey).to.deep.equal(survey);
                    const key = getKey(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurveyAnswers.status).to.equal(status);
                    comparator.answers(answers, userSurveyAnswers.answers);
                })
                .end(done);
        };
    };

    it('login as user 2', shared.loginIndexFn(hxUser, 2));

    it('verify user 2 user survey list in spanish (no translation)', verifyTranslatedUserSurveyListFn(2, ['new', 'new', 'new'], 'es', true));

    it('verify user 2 survey 0 in spanish (no translation)', verifyTranslatedUserSurveyFn(2, 0, 'new', 'es', true));
    it('verify user 2 survey 1 in spanish (no translation)', verifyTranslatedUserSurveyFn(2, 1, 'new', 'es', true));

    it('verify user 2 survey 0 answers in spanish (no translation)', verifyTranslatedUserSurveyAnswersFn(2, 0, 'new', 'es', true));
    it('verify user 2 survey 1 answers in spanish (no transaltion)', verifyTranslatedUserSurveyAnswersFn(2, 1, 'new', 'es', true));

    it('logout as user 2', shared.logoutFn());

    const translateSurveyFn = function (index, language) {
        return function translateSurvey(done) {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            rrSuperTest.patch(`/surveys/text/${language}`, translation, 204)
                .expect(() => {
                    hxSurvey.translate(index, language, translation);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(config.superUser));

    _.range(surveyCount).forEach((i) => {
        it(`translate survey ${i}`, translateSurveyFn(i, 'es'));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(hxUser, 2));

    it('verify user 2 user survey list in spanish', verifyTranslatedUserSurveyListFn(2, ['new', 'new', 'new'], 'es'));

    it('verify user 2 survey 0 in spanish', verifyTranslatedUserSurveyFn(2, 0, 'new', 'es'));
    it('verify user 2 survey 1 in spanish', verifyTranslatedUserSurveyFn(2, 1, 'new', 'es'));

    it('verify user 2 survey 0 answers in spanish', verifyTranslatedUserSurveyAnswersFn(2, 0, 'new', 'es'));
    it('verify user 2 survey 1 answers in spanish', verifyTranslatedUserSurveyAnswersFn(2, 1, 'new', 'es'));

    const answerTranslatedSurveyFullFn = function (userIndex, surveyIndex, status, language) {
        return function answerTranslatedSurveyFull(done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                answers,
                status,
                language,
            };
            const key = getKey(userIndex, surveyIndex);
            rrSuperTest.post(`/user-surveys/${survey.id}/answers`, input, 204)
                .expect(() => {
                    mapAnswers.set(key, answers);
                    mapStatus.set(key, status);
                    answers.forEach((answer) => { answer.language = language; });
                })
                .end(done);
        };
    };

    it('user 2 answers survey 0 all completed', answerTranslatedSurveyFullFn(2, 0, 'completed', 'es'));
    it('user 2 answers survey 1 all in-progress', answerTranslatedSurveyFullFn(2, 1, 'in-progress', 'es'));

    it('verify user 2 survey 0 in spanish', verifyTranslatedUserSurveyFn(2, 0, 'completed', 'es'));
    it('verify user 2 survey 1 in spanish', verifyTranslatedUserSurveyFn(2, 1, 'in-progress', 'es'));

    it('verify user 2 survey 0 answers in spanish', verifyTranslatedUserSurveyAnswersFn(2, 0, 'completed', 'es'));
    it('verify user 2 survey 1 answers in spanish', verifyTranslatedUserSurveyAnswersFn(2, 1, 'in-progress', 'es'));

    it('logout as user 0', shared.logoutFn());

    shared.verifyUserAudit();
});
