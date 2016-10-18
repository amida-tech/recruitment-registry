/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const userExamples = require('./fixtures/example/user');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const History = require('./util/entity-history');
const RRError = require('../lib/rr-error');
const translator = require('./util/translator');

const invalidQuestionsJSON = require('./fixtures/json-schema-invalid/new-question');
const invalidQuestionsSwagger = require('./fixtures/swagger-invalid/new-question');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration();

describe('question integration', function () {
    const user = userExamples.Example;
    const hxUser = new History();

    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('error: create question unauthorized', function (done) {
        const question = generator.newQuestion();
        store.server
            .post('/api/v1.0/questions')
            .send(question)
            .expect(401)
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('create a new user', shared.createUserFn(store, hxUser, user));

    it('logout as super', shared.logoutFn(store));

    it('login as user', shared.loginFn(store, user));

    it('error: create question as non admin', function (done) {
        const question = generator.newQuestion();
        store.server
            .post('/api/v1.0/questions')
            .set('Authorization', store.auth)
            .send(question)
            .expect(403, done);
    });

    it('logout as user', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    const invalidQuestionJSONFn = function (index) {
        return function (done) {
            const question = invalidQuestionsJSON[index];
            store.server
                .post('/api/v1.0/questions')
                .set('Authorization', store.auth)
                .send(question)
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.message).to.equal(RRError.message('jsonSchemaFailed', 'newQuestion'));
                    done();
                });
        };
    };

    for (let i = 0; i < invalidQuestionsJSON.length; ++i) {
        it(`error: invalid (json) question input ${i}`, invalidQuestionJSONFn(i));
    }

    const invalidQuestionSwaggerFn = function (index) {
        return function (done) {
            const question = invalidQuestionsSwagger[index];
            store.server
                .post('/api/v1.0/questions')
                .set('Authorization', store.auth)
                .send(question)
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(Boolean(res.body.message)).to.equal(true);
                    done();
                });
        };
    };

    for (let i = 0; i < invalidQuestionsSwagger.length; ++i) {
        it(`error: invalid (swagger) question input ${i}`, invalidQuestionSwaggerFn(i));
    }

    const hxQuestion = new History();
    const hxSurvey = new History();

    for (let i = 0; i < 10; ++i) {
        it(`create question ${i}`, shared.createQxFn(store, hxQuestion));
    }

    const getAndVerifyQxFn = function (index) {
        return function (done) {
            const id = hxQuestion.id(index);
            store.server
                .get(`/api/v1.0/questions/${id}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxQuestion.reloadServer(res.body);
                    comparator.question(hxQuestion.client(index), res.body);
                    done();
                });
        };
    };

    for (let i = 0; i < 10; ++i) {
        it(`get and verify question ${i}`, getAndVerifyQxFn(i));
    }

    const updateQxFn = function (index) {
        return function (done) {
            const id = hxQuestion.id(index);
            const clientQuestion = hxQuestion.client(index);
            const text = `Updated ${clientQuestion.text}`;
            store.server
                .patch(`/api/v1.0/questions/text/en`)
                .send({ id, text })
                .set('Authorization', store.auth)
                .expect(204, done);
        };
    };

    const verifyUpdatedQxFn = function (index) {
        return function (done) {
            const id = hxQuestion.id(index);
            const clientQuestion = hxQuestion.client(index);
            const text = `Updated ${clientQuestion.text}`;
            const updatedQuestion = Object.assign({}, clientQuestion, { text });
            store.server
                .get(`/api/v1.0/questions/${id}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    comparator.question(updatedQuestion, res.body);
                    done();
                });
        };
    };

    const restoreUpdatedQxFn = function (index) {
        return function (done) {
            const id = hxQuestion.id(index);
            const clientQuestion = hxQuestion.client(index);
            const text = clientQuestion.text;
            store.server
                .patch(`/api/v1.0/questions/text/en`)
                .send({ id, text })
                .set('Authorization', store.auth)
                .expect(204, done);
        };
    };

    for (let i = 0; i < 10; ++i) {
        it(`update question ${i} text`, updateQxFn(i));
        it(`verify updated question ${i}`, verifyUpdatedQxFn(i));
        it(`restore question ${i} text`, restoreUpdatedQxFn(i));
    }

    const getAllAndVerify = function (done) {
        store.server
            .get('/api/v1.0/questions')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const clientQuestions = hxQuestion.listClients();
                comparator.questions(clientQuestions, res.body);
                done();
            });
    };

    it('get all and verify', getAllAndVerify);

    const translateQuestionFn = function (index, language) {
        return function (done) {
            const server = hxQuestion.server(index);
            const translation = translator.translateQuestion(server, language);
            store.server
                .patch(`/api/v1.0/questions/text/${language}`)
                .set('Authorization', store.auth)
                .send(translation)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    hxQuestion.translate(index, language, translation);
                    done();
                });
        };
    };

    const getTranslatedQuestionFn = function (index, language) {
        return function (done) {
            const id = hxQuestion.id(index);
            store.server
                .get(`/api/v1.0/questions/${id}`)
                .query({ language })
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = hxQuestion.translatedServer(index, language);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    const listTranslatedQuestionsFn = function (language) {
        return function (done) {
            store.server
                .get('/api/v1.0/questions')
                .set('Authorization', store.auth)
                .query({ language })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = hxQuestion.listTranslatedServers(language);
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    it('get question 3 in spanish when no name translation', getTranslatedQuestionFn(3, 'es'));

    it('list questions in spanish when no translation', listTranslatedQuestionsFn('es'));

    for (let i = 0; i < 10; ++i) {
        it(`add translated (es) question ${i}`, translateQuestionFn(i, 'es'));
        it(`get and verify tanslated question ${i}`, getTranslatedQuestionFn(i, 'es'));
    }

    it('list and verify translated (es) questions', listTranslatedQuestionsFn('es'));

    for (let i = 0; i < 10; i += 2) {
        it(`add translated (fr) question ${i}`, translateQuestionFn(i, 'fr'));
        it(`get and verify tanslated (fr) question ${i}`, getTranslatedQuestionFn(i, 'fr'));
    }

    it('list and verify translated (fr) questions', listTranslatedQuestionsFn('fr'));

    it('list questions in english (original)', listTranslatedQuestionsFn('en'));

    const deleteQxFn = function (index) {
        return function (done) {
            const id = hxQuestion.id(index);
            store.server
                .delete(`/api/v1.0/questions/${id}`)
                .set('Authorization', store.auth)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    hxQuestion.remove(index);
                    done();
                });
        };
    };

    it(`delete question 1`, deleteQxFn(1));
    it(`delete question 4`, deleteQxFn(4));
    it(`delete question 6`, deleteQxFn(6));

    it('get all and verify', getAllAndVerify);

    for (let i = 10; i < 20; ++i) {
        it(`create question ${i}`, shared.createQxFn(store, hxQuestion));
        it(`get and verify question ${i}`, getAndVerifyQxFn(i));
        it(`update question ${i} text`, updateQxFn(i));
        it(`verify updated question ${i}`, verifyUpdatedQxFn(i));
        it(`restore question ${i} text`, restoreUpdatedQxFn(i));
    }

    const createSurveyFn = function (questionIndices) {
        return function (done) {
            const questionIds = questionIndices.map(index => hxQuestion.id(index));
            const clientSurvey = generator.newSurveyQuestionIds(questionIds);
            store.server
                .post('/api/v1.0/surveys')
                .set('Authorization', store.auth)
                .send(clientSurvey)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.push(clientSurvey, res.body);
                    done();
                });
        };
    };

    [
        [2, 7, 9],
        [7, 11, 13],
        [5, 8, 11, 14, 15]
    ].forEach((questionIndices, index) => {
        it(`create survey ${index} from questions ${questionIndices}`, createSurveyFn(questionIndices));
    });

    const deleteQuestionWhenOnSurveyFn = function (index) {
        return function (done) {
            const id = hxQuestion.id(index);
            store.server
                .delete(`/api/v1.0/questions/${id}`)
                .set('Authorization', store.auth)
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const message = RRError.message('qxReplaceWhenActiveSurveys');
                    expect(res.body.message).to.equal(message);
                    done();
                });
        };
    };

    _.forEach([2, 7, 11, 13, 14], questionIndex => {
        it(`error: delete question ${questionIndex} on an active survey`, deleteQuestionWhenOnSurveyFn(questionIndex));
    });

    const deleteSurveyFn = function (index) {
        return function (done) {
            const id = hxSurvey.id(index);
            store.server
                .delete(`/api/v1.0/surveys/${id}`)
                .set('Authorization', store.auth)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    hxSurvey.remove(index);
                    done();
                });
        };
    };

    it('delete survey 1', deleteSurveyFn(1));

    _.forEach([2, 7, 11, 14], questionIndex => {
        it(`error: delete question ${questionIndex} on an active survey`, deleteQuestionWhenOnSurveyFn(questionIndex));
    });

    it('delete survey 2', deleteSurveyFn(2));

    _.forEach([2, 7], questionIndex => {
        it(`error: delete question ${questionIndex} on an active survey`, deleteQuestionWhenOnSurveyFn(questionIndex));
    });

    _.forEach([5, 11, 15], index => {
        it(`delete question ${index}`, deleteQxFn(index));
    });

    it(`error: replace a non-existent question`, function (done) {
        const replacement = generator.newQuestion();
        store.server
            .post('/api/v1.0/questions')
            .query({ parent: 999 })
            .set('Authorization', store.auth)
            .send(replacement)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const message = RRError.message('qxNotFound');
                expect(res.body.message).to.equal(message);
                done();
            });
    });

    [
        [7, 10, 17],
        [3, 8, 9]
    ].forEach((questionIndices, index) => {
        it(`create survey ${index + 3} from questions ${questionIndices}`, createSurveyFn(questionIndices));
    });

    const replaceQxOnSurvey = function (questionIndex) {
        return function (done) {
            const replacement = generator.newQuestion();
            const parent = hxQuestion.id(questionIndex);
            store.server
                .post('/api/v1.0/questions')
                .query({ parent })
                .set('Authorization', store.auth)
                .send(replacement)
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const message = RRError.message('qxReplaceWhenActiveSurveys');
                    expect(res.body.message).to.equal(message);
                    done();
                });
        };
    };

    _.forEach([2, 7, 9], questionIndex => {
        it(`error: replace question ${questionIndex} on an active survey`, replaceQxOnSurvey(questionIndex));
    });

    it('delete survey 0', deleteSurveyFn(0));

    _.forEach([7, 9], questionIndex => {
        it(`error: replace question ${questionIndex} on an active survey`, replaceQxOnSurvey(questionIndex));
    });

    it('delete survey 3', deleteSurveyFn(3));

    const replaceQxFn = function (questionIndex) {
        return function (done) {
            const replacement = generator.newQuestion();
            const parent = hxQuestion.id(questionIndex);
            store.server
                .post('/api/v1.0/questions')
                .query({ parent })
                .set('Authorization', store.auth)
                .send(replacement)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    hxQuestion.replace(questionIndex, replacement, res.body);
                    done();
                });
        };
    };

    [7, 10, 14, 21, 22, 24].forEach((questionIndex, index) => {
        it(`replace question ${questionIndex} with question ${20 + index}`, replaceQxFn(questionIndex));
        it(`get and verify question ${20 + index}`, getAndVerifyQxFn(20 + index));
        it('get all and verify', getAllAndVerify);
    });
});