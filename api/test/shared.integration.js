/* global token:true,server*/
'use strict';

var chai = require('chai');
var _ = require('lodash');

const expect = chai.expect;

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
