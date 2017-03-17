/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');
const SharedIntegration = require('./util/shared-integration');
const History = require('./util/history');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('user integration', () => {
    let userCount = 8;
    const hxUser = new History();
    const rrSuperTest = new RRSuperTest();

    before(shared.setUpFn(rrSuperTest));

    it('error: get user without previous authentication', (done) => {
        rrSuperTest.get('/users/me', true, 401).end(done);
    });

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    // it('error: get user with wrong jwt token', function (done) {
    //    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // .eyJpZCI6MiwidXNlcm5hbWUiOiJ1ZXN0Iiwicm9sZSI6bnVsbCwiaWF0
    // IjoxNDczNTAwNzE5LCJleHAiOjE0NzYwOTI3MTl9
    // .e0ymr0xrDPuQEBmdQLjb5-WegNtYcqAcpKp_DtDRKo8';
    //    rrSuperTest.get('/users/me', jwt, 401).end(done);
    // });

    it('get super user', () => rrSuperTest.get('/users/me', true, 200)
            .expect((res) => {
                const user = res.body;
                expect(!user).to.equal(false);
                expect(user.username).to.equal(config.superUser.username);
                expect(user.role).to.equal('admin');
            }));

    const getUserFn = function (index) {
        return function getUser() {
            const id = hxUser.id(index);
            return rrSuperTest.get(`/users/${id}`, true, 200)
                .expect((res) => {
                    const client = hxUser.client(index);
                    comparator.user(client, res.body);
                    hxUser.updateServer(index, res.body);
                });
        };
    };

    _.range(userCount / 2).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(rrSuperTest, hxUser));
        it(`get user ${index}`, getUserFn(index));
    });

    _.range(userCount / 2, userCount).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(rrSuperTest, hxUser, undefined, { role: 'clinician' }));
        it(`get user ${index}`, getUserFn(index));
    });

    it('list all non admin users', () => rrSuperTest.get('/users', true, 200)
            .expect((res) => {
                let expected = hxUser.listServers().slice();
                expected = _.sortBy(expected, 'username');
                expect(res.body).to.deep.equal(expected);
            }));

    const listUsersByRoleFn = function (role, range) {
        return function listUsersByRole() {
            return rrSuperTest.get('/users', true, 200, { role })
                .expect((res) => {
                    let expected = hxUser.listServers(undefined, range).slice();
                    expected = _.sortBy(expected, 'username');
                    expect(res.body).to.deep.equal(expected);
                });
        };
    };

    it('list participant users', listUsersByRoleFn('participant', _.range(userCount / 2)));
    it('list clinician users', listUsersByRoleFn('clinician', _.range(userCount / 2, userCount)));

    it('logout as super', shared.logoutFn(rrSuperTest));

    it('login as new user', shared.loginIndexFn(rrSuperTest, hxUser, 0));

    it('get new user', () => rrSuperTest.get('/users/me', true, 200)
            .expect((res) => {
                const expectedUser = _.cloneDeep(hxUser.client(0));
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expectedUser.id = res.body.id;
                expect(res.body).to.deep.equal(expectedUser);
            }));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    it('error: create user with bad email', () => {
        const user = hxUser.client(0);
        const userEmailErr = _.cloneDeep(user);
        userEmailErr.email = 'notanemail';
        userEmailErr.username = `${user.username}1`;
        return rrSuperTest.post('/users', userEmailErr, 400, undefined, true);
    });

    it('error: create the same user', () => {
        const user = hxUser.client(0);
        return rrSuperTest.post('/users', user, 400)
            .expect(res => shared.verifyErrorMessage(res, 'genericUnique', 'username', user.username));
    });

    it('error: create user with the same email', () => {
        const user = hxUser.client(0);
        const newUser = Object.assign({}, user);
        newUser.username = 'anotherusername';
        return rrSuperTest.post('/users', newUser, 400)
            .expect(res => shared.verifyErrorMessage(res, 'uniqueEmail'));
    });

    it('logout as super', shared.logoutFn(rrSuperTest));

    it('login as new user', shared.loginIndexFn(rrSuperTest, hxUser, 0));

    const userUpdate = {
        email: 'newone@example.com',
        password: 'newone',
    };

    it('update all user fields including password', () => rrSuperTest.patch('/users/me', userUpdate, 204));

    it('logout as new user', shared.logoutFn(rrSuperTest));

    it('error: bad login with old password', () => rrSuperTest.authBasic(hxUser.client(0), 401)
            .expect(() => {
                Object.assign(hxUser.client(0), userUpdate);
            }));

    it('login with updated password', shared.loginIndexFn(rrSuperTest, hxUser, 0));

    it('verify updated user fields', () => rrSuperTest.get('/users/me', true, 200)
            .expect((res) => {
                const expected = _.cloneDeep(userUpdate);
                expected.role = 'participant';
                expected.id = res.body.id;
                delete expected.password;
                expected.username = hxUser.client(0).username;
                expect(res.body).to.deep.equal(expected);
            }));

    it('verify updated user fields', () => rrSuperTest.get('/users/me', true, 200)
            .expect((res) => {
                const expected = _.pick(userUpdate, ['email']);
                const actual = _.omit(res.body, ['id', 'role', 'username']);
                expect(actual).to.deep.equal(expected);
            }));

    it('logout as new user', shared.logoutFn(rrSuperTest));

    const patchUserFn = function (index, userPatch) {
        return function patchUser() {
            const id = hxUser.id(index);
            return rrSuperTest.patch(`/users/${id}`, userPatch, 204)
                .then(() => {
                    const server = hxUser.server(index);
                    ['firstname', 'lastname'].forEach((key) => {
                        if (userPatch[key]) {
                            server[key] = userPatch[key];
                        } else {
                            delete server[key];
                        }
                    });
                });
        };
    };

    const verifyUserFn = function (index) {
        return function verifyUser() {
            const id = hxUser.id(index);
            return rrSuperTest.get(`/users/${id}`, true, 200)
                .expect((res) => {
                    expect(res.body).to.deep.equal(hxUser.server(index));
                });
        };
    };

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    it(`create user ${userCount}`, shared.createUserFn(rrSuperTest, hxUser, null, {
        lastname: 'lastname',
        firstname: 'firstname',
    }));
    it(`get user ${userCount}`, getUserFn(userCount));
    it(`patch user ${userCount}`, patchUserFn(userCount, { firstname: 'updfn', lastname: '' }));
    it(`verify user ${userCount}`, verifyUserFn(userCount));
    it(`patch user ${userCount}`, patchUserFn(userCount, { firstname: '', lastname: 'updln' }));

    it(`verify user ${userCount}`, verifyUserFn(userCount));

    userCount += 1;

    it('logout as super', shared.logoutFn(rrSuperTest));

    shared.verifyUserAudit(rrSuperTest);
});
