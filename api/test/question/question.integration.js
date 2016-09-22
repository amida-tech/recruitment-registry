/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../../config');

const shared = require('../shared-integration');
const userExamples = require('../fixtures/user-examples');
const qxHelper = require('../helper/question-helper');
const examples = require('../fixtures/question-examples');

const expect = chai.expect;

describe('question integration', function () {
    const user = userExamples.Example;

    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('error: create question unauthorized', function (done) {
        store.server
            .post('/api/v1.0/questions')
            .send(examples[0])
            .expect(401)
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('create a new user', shared.postUserFn(store, user));

    it('logout as super', shared.logoutFn(store));

    it('login as user', shared.loginFn(store, user));

    it('error: create question as non admin', function (done) {
        store.server
            .post('/api/v1.0/questions')
            .set('Authorization', store.auth)
            .send(examples[0])
            .expect(403, done);
    });

    it('logout as user', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    const ids = [];

    const createQxFn = function (index) {
        return function (done) {
            store.server
                .post('/api/v1.0/questions')
                .set('Authorization', store.auth)
                .send(examples[index])
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    ids.push(res.body.id);
                    done();
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`create question ${i} type ${examples[i].type}`, createQxFn(i));
    }

    const getAndVerifyQxFn = function (index) {
        return function (done) {
            store.server
                .get('/api/v1.0/questions/' + ids[index])
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const actual = qxHelper.prepareServerQuestion(res.body);
                    expect(actual).to.deep.equal(examples[index]);
                    done();
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`get and verify question ${i}`, getAndVerifyQxFn(i));
    }

    const updateQxFn = function (index) {
        return function (done) {
            store.server
                .put('/api/v1.0/questions/' + ids[index])
                .send({ text: examples[index].text })
                .set('Authorization', store.auth)
                .expect(204, done);
        };
    };

    const updateQxTextFn = function (index) {
        return function () {
            const example = examples[index];
            example.text = `Updated ${example.text}`;
        };
    };

    const restoreQxTextFn = function (index) {
        return function () {
            const example = examples[index];
            example.text = example.text.slice(8);
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`update question sample ${i} texts`, updateQxTextFn(i));
        it(`update question ${i}`, updateQxFn(i));
        it(`get and verify question ${i}`, getAndVerifyQxFn(i));
        it(`restore question sample ${i} texts`, restoreQxTextFn(i));
        it(`update question ${i}`, updateQxFn(i));
    }

    it('get all and verify', function (done) {
        store.server
            .get('/api/v1.0/questions')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                qxHelper.prepareClientQuestions(examples, ids, _.range(examples.length))
                    .then(expected => {
                        expect(res.body).to.deep.equal(expected);
                        done();
                    })
                    .catch(err => done(err));
            });
    });

    const deleteQxFn = function (index) {
        return function (done) {
            store.server
                .delete('/api/v1.0/questions/' + ids[index])
                .set('Authorization', store.auth)
                .expect(204, done);
        };
    };

    it(`delete question 0`, deleteQxFn(0));
    it(`delete question 2`, deleteQxFn(2));

    it('get all and verify', function (done) {
        store.server
            .get('/api/v1.0/questions')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                qxHelper.prepareClientQuestions(examples, ids, [1, 3, 4])
                    .then(expected => {
                        expect(res.body).to.deep.equal(expected);
                        done();
                    })
                    .catch(err => done(err));
            });
    });
});
