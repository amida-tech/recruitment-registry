/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const userExamples = require('./fixtures/example/user');

const config = require('../config');
const SharedIntegration = require('./util/shared-integration');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('user integration', function () {
    const user = userExamples.Example;
    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('invalid path', function (done) {
        store.server
            .get('/xxxxxxx')
            .expect(404)
            .end(done);
    });

    it('error: get user without previous authentication', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .expect(401, done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('error: get user with wrong jwt token', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1ZXN0Iiwicm9sZSI6bnVsbCwiaWF0IjoxNDczNTAwNzE5LCJleHAiOjE0NzYwOTI3MTl9.e0ymr0xrDPuQEBmdQLjb5-WegNtYcqAcpKp_DtDRKo8')
            .expect(401, done);
    });

    it('get super user', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const user = res.body;
                expect(!user).to.equal(false);
                expect(user.username).to.equal(config.superUser.username);
                expect(user.role).to.equal('admin');
                done();
            });
    });

    it('create a new user', function (done) {
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(user)
            .expect(201, done);
    });

    it('login as new user', shared.loginFn(store, user));

    it('get new user', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                delete res.body.id;
                const expectedUser = _.cloneDeep(user);
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(res.body).to.deep.equal(expectedUser);
                done();
            });
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('error: create user with bad email', function (done) {
        const userEmailErr = _.cloneDeep(user);
        userEmailErr.email = 'notanemail';
        userEmailErr.username = user.username + '1';
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(userEmailErr)
            .expect(400)
            .end(done);
    });

    it('error: create the same user', function (done) {
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(user)
            .expect(400)
            .end(done);
    });

    it('login as new user', shared.loginFn(store, user));

    let userUpdate = {
        email: 'newone@example.com',
        password: 'newone'
    };

    it('update all user fields including password', function (done) {
        store.server
            .patch('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .send(userUpdate)
            .expect(200, done);
    });

    it('error: bad login with old password', shared.badLoginFn(store, user));

    it('login with updated password', shared.loginFn(store, {
        username: user.username,
        password: userUpdate.password
    }));

    it('verify updated user fields', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const expected = _.cloneDeep(userUpdate);
                expected.role = 'participant';
                expected.id = res.body.id;
                delete expected.password;
                expected.username = user.username;
                expect(res.body).to.deep.equal(expected);
                done();
            });
    });

    it('verify updated user fields', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const expected = _.pick(userUpdate, ['email']);
                const actual = _.omit(res.body, ['id', 'role', 'username']);
                expect(actual).to.deep.equal(expected);
                done();
            });
    });
});
