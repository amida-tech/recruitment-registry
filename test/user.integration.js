/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');
const SharedIntegration = require('./util/shared-integration');
const History = require('./util/history');
const RRSuperTest = require('./util/rr-super-test');
const RRError = require('../lib/rr-error');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('user integration', function () {
    const userCount = 8;
    const hxUser = new History();
    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    it('error: get user without previous authentication', function (done) {
        store.get('/users/me', true, 401).end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    //it('error: get user with wrong jwt token', function (done) {
    //    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1ZXN0Iiwicm9sZSI6bnVsbCwiaWF0IjoxNDczNTAwNzE5LCJleHAiOjE0NzYwOTI3MTl9.e0ymr0xrDPuQEBmdQLjb5-WegNtYcqAcpKp_DtDRKo8';
    //    store.get('/users/me', jwt, 401).end(done);
    //});

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

    const getUserFn = function (index) {
        return function (done) {
            const id = hxUser.id(index);
            store.get(`/users/${id}`, true, 200)
                .expect(function (res) {
                    const client = hxUser.client(index);
                    comparator.user(client, res.body);
                    hxUser.updateServer(index, res.body);
                })
                .end(done);
        };
    };

    _.range(userCount / 2).forEach(index => {
        it(`create user ${index}`, shared.createUserFn(store, hxUser));
        it(`get user ${index}`, getUserFn(index));
    });

    _.range(userCount / 2, userCount).forEach(index => {
        it(`create user ${index}`, shared.createUserFn(store, hxUser, undefined, { role: 'clinician' }));
        it(`get user ${index}`, getUserFn(index));
    });

    it('list all non admin users', function (done) {
        store.get('/users', true, 200)
            .expect(function (res) {
                let expected = hxUser.listServers().slice();
                expected = _.sortBy(expected, 'username');
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    it('list all participant users', function (done) {
        store.get('/users', true, 200, { role: 'participant' })
            .expect(function (res) {
                let expected = hxUser.listServers(undefined, _.range(userCount / 2)).slice();
                expected = _.sortBy(expected, 'username');
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    it('list all clinician users', function (done) {
        store.get('/users', true, 200, { role: 'clinician' })
            .expect(function (res) {
                let expected = hxUser.listServers(undefined, _.range(userCount / 2, userCount)).slice();
                expected = _.sortBy(expected, 'username');
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    it('logout as super', shared.logoutFn(store));

    it('login as new user', shared.loginIndexFn(store, hxUser, 0));

    it('get new user', function (done) {
        store.get('/users/me', true, 200)
            .expect(function (res) {
                delete res.body.id;
                const expectedUser = _.cloneDeep(hxUser.client(0));
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(res.body).to.deep.equal(expectedUser);
            })
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('error: create user with bad email', function (done) {
        const user = hxUser.client(0);
        const userEmailErr = _.cloneDeep(user);
        userEmailErr.email = 'notanemail';
        userEmailErr.username = user.username + '1';
        store.post('/users', userEmailErr, 400, undefined, true).end(done);
    });

    it('error: create the same user', function (done) {
        const user = hxUser.client(0);
        store.post('/users', user, 400)
            .expect(function (res) {
                expect(res.body.message).to.equal(RRError.message('uniqueUsername'));
            })
            .end(done);
    });

    it('error: create user with the same email', function (done) {
        const user = hxUser.client(0);
        const newUser = Object.assign({}, user);
        newUser.username = 'anotherusername';
        store.post('/users', newUser, 400)
            .expect(function (res) {
                expect(res.body.message).to.equal(RRError.message('uniqueEmail'));
            })
            .end(done);
    });

    it('logout as super', shared.logoutFn(store));

    it('login as new user', shared.loginIndexFn(store, hxUser, 0));

    let userUpdate = {
        email: 'newone@example.com',
        password: 'newone'
    };

    it('update all user fields including password', function (done) {
        store.patch('/users/me', userUpdate, 204).end(done);
    });

    it('logout as new user', shared.logoutFn(store));

    it('error: bad login with old password', function (done) {
        store.authBasic(hxUser.client(0), 401)
            .expect(function () {
                Object.assign(hxUser.client(0), userUpdate);
            })
            .end(done);
    });

    it('login with updated password', shared.loginIndexFn(store, hxUser, 0));

    it('verify updated user fields', function (done) {
        store.get('/users/me', true, 200)
            .expect(function (res) {
                const expected = _.cloneDeep(userUpdate);
                expected.role = 'participant';
                expected.id = res.body.id;
                delete expected.password;
                expected.username = hxUser.client(0).username;
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

    shared.verifyUserAudit(store);
});
