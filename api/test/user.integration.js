/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');
const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/entity-generator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('user integration', function () {
    const user = generator.newUser();
    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    it('invalid path', function (done) {
        store.get('/xxxxxxx', false, 404).end(done);
    });

    it('error: get user without previous authentication', function (done) {
        store.get('/users/me', true, 401).end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('error: get user with wrong jwt token', function (done) {
        const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1ZXN0Iiwicm9sZSI6bnVsbCwiaWF0IjoxNDczNTAwNzE5LCJleHAiOjE0NzYwOTI3MTl9.e0ymr0xrDPuQEBmdQLjb5-WegNtYcqAcpKp_DtDRKo8';
        store.get('/users/me', jwt, 401).end(done);
    });

    it('get super user', function (done) {
        store.get('/users/me', true, 200)
            .expect(function (res) {
                const user = res.body;
                expect(!user).to.equal(false);
                expect(user.username).to.equal(config.superUser.username);
                expect(user.role).to.equal('admin');
            })
            .end(done);
    });

    it('logout as super', shared.logoutFn(store));

    it('create a new user', function (done) {
        store.post('/users', user, 201)
            .expect(function (res) {
                shared.updateStoreFromCookie(store, res);
            })
            .end(done);
    });

    it('get new user', function (done) {
        store.get('/users/me', true, 200)
            .expect(function (res) {
                delete res.body.id;
                const expectedUser = _.cloneDeep(user);
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(res.body).to.deep.equal(expectedUser);
            })
            .end(done);
    });

    it('logout s new user', shared.logoutFn(store));

    it('login as new user', shared.loginFn(store, user));

    it('get new user', function (done) {
        store.get('/users/me', true, 200)
            .expect(function (res) {
                delete res.body.id;
                const expectedUser = _.cloneDeep(user);
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(res.body).to.deep.equal(expectedUser);
            })
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('error: create user with bad email', function (done) {
        const userEmailErr = _.cloneDeep(user);
        userEmailErr.email = 'notanemail';
        userEmailErr.username = user.username + '1';
        store.post('/users', userEmailErr, 400).end(done);
    });

    it('error: create the same user', function (done) {
        store.post('/users', user, 400).end(done);
    });

    it('login as new user', shared.loginFn(store, user));

    let userUpdate = {
        email: 'newone@example.com',
        password: 'newone'
    };

    it('update all user fields including password', function (done) {
        store.patch('/users/me', userUpdate, 204).end(done);
    });

    it('error: bad login with old password', shared.badLoginFn(store, user));

    it('login with updated password', shared.loginFn(store, {
        username: user.username,
        password: userUpdate.password
    }));

    it('verify updated user fields', function (done) {
        store.get('/users/me', true, 200)
            .expect(function (res) {
                const expected = _.cloneDeep(userUpdate);
                expected.role = 'participant';
                expected.id = res.body.id;
                delete expected.password;
                expected.username = user.username;
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    it('verify updated user fields', function (done) {
        store.get('/users/me', true, 200)
            .expect(function (res) {
                const expected = _.pick(userUpdate, ['email']);
                const actual = _.omit(res.body, ['id', 'role', 'username']);
                expect(actual).to.deep.equal(expected);
            })
            .end(done);
    });
});
