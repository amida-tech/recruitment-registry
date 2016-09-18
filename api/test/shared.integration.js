'use strict';

const request = require('supertest');
var chai = require('chai');

const appgen = require('../app-generator');

const expect = chai.expect;

exports.setUpFn = function (store) {
    return function (done) {
        appgen.generate(function (err, app) {
            if (err) {
                return done(err);
            }
            store.server = request(app);
            done();
        });
    };
};

exports.loginFn = function (store, login) {
    return function (done) {
        store.server
            .get('/api/v1.0/auth/basic')
            .auth(login.username, login.password)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                store.auth = 'Bearer ' + res.body.token;
                done();
            });
    };
};

exports.badLoginFn = function (store, login) {
    return function (done) {
        store.server
            .get('/api/v1.0/auth/basic')
            .auth(login.username, login.password)
            .expect(401, done);
    };
};

exports.postUserFn = function (store, user) {
    return function (done) {
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(user)
            .expect(201, done);
    };
};

exports.postSurveyFn = function (store, survey) {
    return function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .set('Authorization', store.auth)
            .send(survey)
            .expect(201)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(done);
    };
};
