/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const config = require('../config');

const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const SurveyHistory = require('./util/survey-history');
const Shared = require('./util/shared-integration');
const RRError = require('../lib/rr-error');
const comparator = require('./util/client-server-comparator');
const translator = require('./util/translator');

const expect = chai.expect;
const generator = new Generator();
const shared = new Shared(generator);

describe('user survey integration', function () {
    const userCount = 3;
    let surveyCount = 3;

    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const mapAnswers = new Map();
    const mapStatus = new Map();

    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    const _key = function (userIndex, surveyIndex) {
        return `${userIndex}:${surveyIndex}`;
    };

    it('login as super', shared.loginFn(store, config.superUser));
    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUserFn(store, hxUser));
    }
    it('logout as super', shared.logoutFn(store));

    const verifyNoUserSurveys = function (done) {
        store.server
            .get(`/api/v1.0/user-surveys`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                const userSurveys = res.body;
                expect(userSurveys.length).to.equal(0);
            })
            .end(done);
    };

    for (let i = 0; i < userCount; ++i) {
        it(`login as user ${i}`, shared.loginIndexFn(store, hxUser, i));
        it(`verify no surveys for user ${i}`, verifyNoUserSurveys);
        it(`logout as user ${i}`, shared.logoutFn(store));
    }

    const verifySurveyFn = function (index) {
        return function (done) {
            const surveyId = hxSurvey.id(index);
            store.server
                .get(`/api/v1.0/surveys/${surveyId}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const survey = res.body;
                    hxSurvey.updateServer(index, survey);
                    comparator.survey(hxSurvey.client(index), survey)
                        .then(done, done);
                });
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));
    for (let i = 0; i < surveyCount; ++i) {
        it(`create survey ${i}`, shared.createSurveyFn(store, hxSurvey));
        it(`get/verify survey ${i}`, verifySurveyFn(i));
    }
    it('logout as super', shared.logoutFn(store));

    const verifyStatusFn = function (surveyIndex, expectedStatus) {
        return function (done) {
            const surveyId = hxSurvey.id(surveyIndex);
            store.server
                .get(`/api/v1.0/user-surveys/${surveyId}/status`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .expect(function (res) {
                    const status = res.body.status;
                    expect(status).to.equal(expectedStatus);
                })
                .end(done);
        };
    };

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('verify user 0 survey 0 status', verifyStatusFn(0, 'new'));
    it('verify user 0 survey 1 status', verifyStatusFn(1, 'new'));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('verify user 1 survey 0 status', verifyStatusFn(0, 'new'));
    it('verify user 1 survey 1 status', verifyStatusFn(1, 'new'));
    it('logout as user 1', shared.logoutFn(store));

    const verifyUserSurveyListFn = function (statusList) {
        return function (done) {
            store.server
                .get(`/api/v1.0/user-surveys`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .expect(function (res) {
                    const userSurveys = res.body;
                    const expected = hxSurvey.listServers().map(({ id, name }, index) => ({ id, name, status: statusList[index] }));
                    expect(userSurveys).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('verify user 0 user survey list', verifyUserSurveyListFn(['new', 'new', 'new']));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('verify user 1 user survey list', verifyUserSurveyListFn(['new', 'new', 'new']));
    it('logout as user 1', shared.logoutFn(store));

    const verifyUserSurveyFn = function (userIndex, surveyIndex, status) {
        return function (done) {
            const surveyId = hxSurvey.id(surveyIndex);
            store.server
                .get(`/api/v1.0/user-surveys/${surveyId}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .expect(function (res) {
                    const userSurvey = res.body;
                    const survey = hxSurvey.server(surveyIndex);
                    const key = _key(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurvey.status).to.equal(status);
                    comparator.answeredSurvey(survey, answers, userSurvey.survey);
                })
                .end(done);
        };
    };

    const verifyUserSurveyAnswersFn = function (userIndex, surveyIndex, status, includeSurvey) {
        return function (done) {
            const surveyId = hxSurvey.id(surveyIndex);
            const query = {};
            if (includeSurvey) {
                query['include-survey'] = true;
            }
            store.server
                .get(`/api/v1.0/user-surveys/${surveyId}/answers`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query(query)
                .expect(200)
                .expect(function (res) {
                    const userSurveyAnswers = res.body;
                    if (includeSurvey) {
                        const survey = hxSurvey.server(surveyIndex);
                        expect(userSurveyAnswers.survey).to.deep.equal(survey);
                    } else {
                        expect(userSurveyAnswers.survey).to.equal(undefined);
                    }
                    const key = _key(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurveyAnswers.status).to.equal(status);
                    comparator.answers(answers, userSurveyAnswers.answers);
                })
                .end(done);
        };
    };

    const answerSurveyFullFn = function (userIndex, surveyIndex, status) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                answers,
                status
            };
            const key = _key(userIndex, surveyIndex);
            store.post(`/user-surveys/${survey.id}/answers`, input, 204)
                .expect(function () {
                    mapAnswers.set(key, answers);
                    mapStatus.set(key, status);
                })
                .end(done);
        };
    };

    const answerSurveyPartialFn = function (userIndex, surveyIndex) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'in-progress'
            };
            const key = _key(userIndex, surveyIndex);
            store.post(`/user-surveys/${survey.id}/answers`, input, 204)
                .expect(function () {
                    mapAnswers.set(key, answers);
                    mapStatus.set(key, 'in-progress');
                })
                .end(done);
        };
    };

    const answerSurveyMissingPlusCompletedFn = function (userIndex, surveyIndex) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const notRequiredQuestions = survey.questions.filter(question => !question.required);
            expect(notRequiredQuestions).to.have.length.above(0);
            const questions = [...requiredQuestions, notRequiredQuestions[0]];
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'completed'
            };
            const key = _key(userIndex, surveyIndex);
            store.post(`/user-surveys/${survey.id}/answers`, input, 204)
                .expect(function () {
                    const qxIdsNewlyAnswered = new Set(answers.map(answer => answer.questionId));
                    const previousAnswers = mapAnswers.get(key, answers).filter(answer => !qxIdsNewlyAnswered.has(answer.questionId));
                    mapAnswers.set(key, [...previousAnswers, ...answers]);
                    mapStatus.set(key, 'completed');
                })
                .end(done);
        };
    };

    const answerSurveyPartialCompletedFn = function (userIndex, surveyIndex) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const requiredQuestions = survey.questions.filter(question => question.required);
            expect(requiredQuestions).to.have.length.above(0);
            const questions = survey.questions.filter(question => !question.required);
            const answers = generator.answerQuestions(questions);
            const input = {
                answers,
                status: 'completed'
            };
            store.post(`/user-surveys/${survey.id}/answers`, input, 400)
                .expect(function (res) {
                    const message = RRError.message('answerRequiredMissing');
                    expect(res.body.message).to.equal(message);
                })
                .end(done);
        };

    };

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('verify user 0 survey 0', verifyUserSurveyFn(0, 0, 'new'));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'new'));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('verify user 1 survey 0', verifyUserSurveyFn(1, 0, 'new'));
    it('verify user 1 survey 1', verifyUserSurveyFn(1, 1, 'new'));
    it('logout as user 1', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('verify user 0 survey 0 answers', verifyUserSurveyAnswersFn(0, 0, 'new'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'new'));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('verify user 1 survey 0 answers', verifyUserSurveyAnswersFn(1, 0, 'new'));
    it('verify user 1 survey 1 answers', verifyUserSurveyAnswersFn(1, 1, 'new'));
    it('logout as user 1', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('verify user 0 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(0, 0, 'new', true));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'new', true));
    it('logout as user 0', shared.logoutFn(store));
    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('verify user 1 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(1, 0, 'new', true));
    it('verify user 1 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(1, 1, 'new', true));
    it('logout as user 1', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 answers survey 0 all completed', answerSurveyFullFn(0, 0, 'completed'));
    it('verify user 0 survey 0', verifyUserSurveyFn(0, 0, 'completed'));
    it('verify user 0 survey 0 status', verifyStatusFn(0, 'completed'));
    it('verify user 0 survey 0 answers', verifyUserSurveyAnswersFn(0, 0, 'completed'));
    it('verify user 0 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(0, 0, 'completed', true));
    it('verify user 0 user survey list', verifyUserSurveyListFn(['completed', 'new', 'new']));
    it('logout as user 0', shared.logoutFn(store));

    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 answers survey 1 all in-progress', answerSurveyFullFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1', verifyUserSurveyFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 status', verifyStatusFn(1, 'in-progress'));
    it('verify user 1 survey 1 answers', verifyUserSurveyAnswersFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(1, 1, 'in-progress', true));
    it('verify user 1 user survey list', verifyUserSurveyListFn(['new', 'in-progress', 'new']));
    it('logout as user 1', shared.logoutFn(store));

    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 reanswers survey 1 all in-progress', answerSurveyFullFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1', verifyUserSurveyFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 status', verifyStatusFn(1, 'in-progress'));
    it('verify user 1 survey 1 answers', verifyUserSurveyAnswersFn(1, 1, 'in-progress'));
    it('verify user 1 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(1, 1, 'in-progress', true));
    it('verify user 1 user survey list', verifyUserSurveyListFn(['new', 'in-progress', 'new']));
    it('logout as user 1', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 answers survey 1 partial in-progress', answerSurveyPartialFn(0, 1));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'in-progress'));
    it('verify user 0 survey 1 status', verifyStatusFn(1, 'in-progress'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'in-progress'));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'in-progress', true));
    it('verify user 0 user survey list', verifyUserSurveyListFn(['completed', 'in-progress', 'new']));
    it('logout as user 0', shared.logoutFn(store));

    it('login as user 1', shared.loginIndexFn(store, hxUser, 1));
    it('user 1 answers survey 0 partial completed', answerSurveyPartialCompletedFn(1, 0));
    it('verify user 1 survey 0', verifyUserSurveyFn(1, 0, 'new'));
    it('verify user 1 survey 0 status', verifyStatusFn(0, 'new'));
    it('verify user 1 survey 0 answers', verifyUserSurveyAnswersFn(1, 0, 'new'));
    it('verify user 1 survey 0 answers (with survey)', verifyUserSurveyAnswersFn(1, 0, 'new', true));
    it('verify user 1 user survey list', verifyUserSurveyListFn(['new', 'in-progress', 'new']));
    it('logout as user 1', shared.logoutFn(store));

    it('login as user 0', shared.loginIndexFn(store, hxUser, 0));
    it('user 0 reanswers survey 1 required plus completed', answerSurveyMissingPlusCompletedFn(0, 1));
    it('verify user 0 survey 1', verifyUserSurveyFn(0, 1, 'completed'));
    it('verify user 0 survey 1 status', verifyStatusFn(1, 'completed'));
    it('verify user 0 survey 1 answers', verifyUserSurveyAnswersFn(0, 1, 'completed'));
    it('verify user 0 survey 1 answers (with survey)', verifyUserSurveyAnswersFn(0, 1, 'completed', true));
    it('verify user 0 user survey list', verifyUserSurveyListFn(['completed', 'completed', 'new']));
    it('logout as user 0', shared.logoutFn(store));

    const verifyTranslatedUserSurveyListFn = function (userIndex, statusList, language, notTranslated) {
        return function (done) {
            store.server
                .get(`/api/v1.0/user-surveys`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query({ language })
                .expect(200)
                .expect(function (res) {
                    const userSurveys = res.body;
                    if (!notTranslated) {
                        translator.isSurveyListTranslated(userSurveys, language);
                    }
                    const list = hxSurvey.listTranslatedServers(language);
                    const expected = list.map(({ id, name }, index) => ({ id, name, status: statusList[index] }));
                    expect(userSurveys).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const verifyTranslatedUserSurveyFn = function (userIndex, surveyIndex, status, language, notTranslated) {
        return function (done) {
            const surveyId = hxSurvey.id(surveyIndex);
            store.server
                .get(`/api/v1.0/user-surveys/${surveyId}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query({ language })
                .expect(200)
                .expect(function (res) {
                    const userSurvey = res.body;
                    const survey = hxSurvey.translatedServer(surveyIndex, language);
                    if (!notTranslated) {
                        translator.isSurveyTranslated(userSurvey.survey, language);
                    }
                    const key = _key(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurvey.status).to.equal(status);
                    comparator.answeredSurvey(survey, answers, userSurvey.survey);
                })
                .end(done);
        };
    };

    const verifyTranslatedUserSurveyAnswersFn = function (userIndex, surveyIndex, status, language, notTranslated) {
        return function (done) {
            const surveyId = hxSurvey.id(surveyIndex);
            const query = { 'include-survey': true, language };
            store.server
                .get(`/api/v1.0/user-surveys/${surveyId}/answers`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query(query)
                .expect(200)
                .expect(function (res) {
                    const userSurveyAnswers = res.body;
                    const survey = hxSurvey.translatedServer(surveyIndex, language);
                    if (!notTranslated) {
                        translator.isSurveyTranslated(userSurveyAnswers.survey, language);
                    }
                    expect(userSurveyAnswers.survey).to.deep.equal(survey);
                    const key = _key(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurveyAnswers.status).to.equal(status);
                    comparator.answers(answers, userSurveyAnswers.answers);
                })
                .end(done);
        };
    };

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));

    it('verify user 2 user survey list in spanish (no translation)', verifyTranslatedUserSurveyListFn(2, ['new', 'new', 'new'], 'es', true));

    it('verify user 2 survey 0 in spanish (no translation)', verifyTranslatedUserSurveyFn(2, 0, 'new', 'es', true));
    it('verify user 2 survey 1 in spanish (no translation)', verifyTranslatedUserSurveyFn(2, 1, 'new', 'es', true));

    it('verify user 2 survey 0 answers in spanish (no translation)', verifyTranslatedUserSurveyAnswersFn(2, 0, 'new', 'es', true));
    it('verify user 2 survey 1 answers in spanish (no transaltion)', verifyTranslatedUserSurveyAnswersFn(2, 1, 'new', 'es', true));

    it('logout as user 2', shared.logoutFn(store));

    const translateSurveyFn = function (index, language) {
        return function (done) {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            store.patch(`/surveys/text/${language}`, translation, 204)
                .expect(function () {
                    hxSurvey.translate(index, language, translation);
                })
                .end(done);
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < surveyCount; ++i) {
        it(`translate survey ${i}`, translateSurveyFn(i, 'es'));
    }

    it('logout as super', shared.logoutFn(store));

    it('login as user 2', shared.loginIndexFn(store, hxUser, 2));

    it('verify user 2 user survey list in spanish', verifyTranslatedUserSurveyListFn(2, ['new', 'new', 'new'], 'es'));

    it('verify user 2 survey 0 in spanish', verifyTranslatedUserSurveyFn(2, 0, 'new', 'es'));
    it('verify user 2 survey 1 in spanish', verifyTranslatedUserSurveyFn(2, 1, 'new', 'es'));

    it('verify user 2 survey 0 answers in spanish', verifyTranslatedUserSurveyAnswersFn(2, 0, 'new', 'es'));
    it('verify user 2 survey 1 answers in spanish', verifyTranslatedUserSurveyAnswersFn(2, 1, 'new', 'es'));

    const answerTranslatedSurveyFullFn = function (userIndex, surveyIndex, status, language) {
        return function (done) {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerQuestions(survey.questions);
            const input = {
                answers,
                status,
                language
            };
            const key = _key(userIndex, surveyIndex);
            store.post(`/user-surveys/${survey.id}/answers`, input, 204)
                .expect(function () {
                    mapAnswers.set(key, answers);
                    mapStatus.set(key, status);
                    answers.forEach(answer => answer.language = language);
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

    it('logout as user 0', shared.logoutFn(store));
});
