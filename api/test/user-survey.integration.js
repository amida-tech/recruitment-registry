/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const config = require('../config');

const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const SurveyHistory = require('./util/survey-history');
const Shared = require('./util/shared-integration');
const RRError = require('../lib/rr-error');
const comparator = require('./util/client-server-comparator');

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

    const store = {
        server: null,
        auth: null
    };

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
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const userSurveys = res.body;
                expect(userSurveys.length).to.equal(0);
                done();
            });
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
                .set('Authorization', store.auth)
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
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const status = res.body.status;
                    expect(status).to.equal(expectedStatus);
                    done();
                });
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
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const userSurveys = res.body;
                    const expected = hxSurvey.listServers().map(({ id, name }, index) => ({ id, name, status: statusList[index] }));
                    expect(userSurveys).to.deep.equal(expected);
                    done();
                });
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
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const userSurvey = res.body;
                    const survey = hxSurvey.server(surveyIndex);
                    const key = _key(userIndex, surveyIndex);
                    const answers = mapAnswers.get(key) || [];
                    expect(userSurvey.status).to.equal(status);
                    comparator.answeredSurvey(survey, answers, userSurvey.survey);
                    done();
                });
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
                .set('Authorization', store.auth)
                .query(query)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
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
                    done();
                });
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
            store.server
                .post(`/api/v1.0/user-surveys/${survey.id}/answers`)
                .set('Authorization', store.auth)
                .send(input)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    mapAnswers.set(key, answers);
                    mapStatus.set(key, status);
                    done();
                });
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
            store.server
                .post(`/api/v1.0/user-surveys/${survey.id}/answers`)
                .set('Authorization', store.auth)
                .send(input)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    mapAnswers.set(key, answers);
                    mapStatus.set(key, 'in-progress');
                    done();
                });
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
            store.server
                .post(`/api/v1.0/user-surveys/${survey.id}/answers`)
                .set('Authorization', store.auth)
                .send(input)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    const qxIdsNewlyAnswered = new Set(answers.map(answer => answer.questionId));
                    const previousAnswers = mapAnswers.get(key, answers).filter(answer => !qxIdsNewlyAnswered.has(answer.questionId));
                    mapAnswers.set(key, [...previousAnswers, ...answers]);
                    mapStatus.set(key, 'completed');
                    done();
                });
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
            store.server
                .post(`/api/v1.0/user-surveys/${survey.id}/answers`)
                .set('Authorization', store.auth)
                .send(input)
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const message = RRError.message('answerRequiredMissing');
                    expect(res.body.message).to.equal(message);
                    done();
                });
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
});
