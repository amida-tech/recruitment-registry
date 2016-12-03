/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const _ = require('lodash');

const SPromise = require('../lib/promise');
const SharedSpec = require('./util/shared-spec');
const History = require('./util/entity-history');
const config = require('../config');
const models = require('../models');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');
const testJsutil = require('./util/test-jsutil');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('user unit', function () {
    const userCount = 4;

    const hxUser = new History();

    before(shared.setUpFn());

    const createUserFn = function () {
        return function () {
            const user = generator.newUser();
            return models.user.createUser(user)
                .then(({ id }) => {
                    hxUser.pushWithId(user, id);
                });
        };
    };

    const getUserFn = function (index) {
        return function () {
            const id = hxUser.id(index);
            return models.user.getUser(id)
                .then(user => {
                    comparator.user(hxUser.client(index), user);
                });
        };
    };

    const authenticateUserFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            return models.user.authenticateUser(client.username, client.password);
        };
    };

    const authenticateUserErrorFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            return models.user.authenticateUser(client.username, client.password + 'a')
                .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'));
        };
    };

    const updateUserPasswordFn = function (index) {
        return function () {
            const password = generator.newUser().password;
            const id = hxUser.id(index);
            return models.user.updateUser(id, { password })
                .then(() => {
                    hxUser.client(index).password = password;
                });
        };
    };

    const updateUserFn = function (index) {
        return function () {
            const { email, password } = generator.newUser();
            const id = hxUser.id(index);
            return models.user.updateUser(id, { email, password })
                .then(() => {
                    hxUser.client(index).email = email;
                    hxUser.client(index).password = password;
                });
        };
    };

    _.range(userCount).forEach(index => {
        it(`create user ${index}`, createUserFn());
        it(`get user ${index}`, getUserFn(index));
        it(`authenticate user ${index}`, authenticateUserFn(index));
        it(`error: authenticate user ${index} with wrong password`, authenticateUserErrorFn(index));
        it(`update password for user ${index}`, updateUserPasswordFn(index));
        it(`authenticate user ${index}`, authenticateUserFn(index));
        it(`update user ${index}`, updateUserFn(index));
        it(`get user ${index}`, getUserFn(index));
        it(`authenticate user ${index}`, authenticateUserFn(index));
    });

    it('error: update username', function () {
        const id = hxUser.id(0);
        return models.user.updateUser(id, { username: 'rejectusername' })
            .then(shared.throwingHandler, err => {
                expect(err.message).to.equal('Field username cannot be updated.');
            });
    });

    const uniqUsernameErrorFn = function (index) {
        return function () {
            const user = generator.newUser();
            const username = hxUser.client(index).username;
            user.username = username;
            return models.user.createUser(user)
                .then(shared.throwingHandler, shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', { username }, 'uniqueUsername'));
        };
    };

    const uniqUsernameEmailErrorFn = function (index) {
        return function () {
            const user = generator.newUser();
            const username = hxUser.client(index).username;
            user.username = username;
            user.email = hxUser.client(index).email;
            return models.user.createUser(user)
                .then(shared.throwingHandler, shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', { username }, 'uniqueUsername'));
        };
    };

    const uniqEmailErrorFn = function (index) {
        return function () {
            const user = generator.newUser();
            user.email = hxUser.client(index).email;
            const fields = { 'lower(email)': user.email.toLowerCase() };
            return models.user.createUser(user)
                .then(shared.throwingHandler, shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', fields));
        };
    };

    const uniqOppCaseEmailErrorFn = function (index) {
        return function () {
            const user = generator.newUser();
            user.email = testJsutil.oppositeCase(hxUser.client(index).email);
            const fields = { 'lower(email)': user.email.toLowerCase() };
            return models.user.createUser(user)
                .then(shared.throwingHandler, shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', fields));
        };
    };

    _.range(userCount).forEach(index => {
        it(`error: create user with username of user ${index}`, uniqUsernameErrorFn(index));
        it(`error: create user with email of user ${index}`, uniqEmailErrorFn(index));
        it(`error: create user with opposite case email of user ${index}`, uniqOppCaseEmailErrorFn(index));
        it(`error: create user with username and email of user ${index}`, uniqUsernameEmailErrorFn(index));
    });

    const invalidUsernameErrorFn = function (value) {
        return function () {
            const user = generator.newUser();
            if (value === '--') {
                delete user.username;
            } else {
                user.username = value;
            }
            return models.user.createUser(user)
                .then(shared.throwingHandler, err => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['--', 'no'],
        ['', 'empty']
    ].forEach(([value, msg]) => {
        it(`error: create user with ${msg} username`, invalidUsernameErrorFn(value));
    });

    const invalidPasswordErrorFn = function (value) {
        return function () {
            const user = generator.newUser();
            if (value === '--') {
                delete user.password;
            } else {
                user.password = value;
            }
            return models.user.createUser(user)
                .then(shared.throwingHandler, err => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['--', 'no'],
        ['', 'empty']
    ].forEach(([value, msg]) => {
        it(`error: create user with ${msg} password`, invalidPasswordErrorFn(value));
    });

    const invalidPasswordUpdateErrorFn = function (value) {
        return function () {
            const id = hxUser.id(0);
            return models.user.updateUser(id, { password: value })
                .then(shared.throwingHandler, err => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['', 'empty']
    ].forEach(([value, msg]) => {
        it(`error: update user with ${msg} password`, invalidPasswordUpdateErrorFn(value));
    });

    const invalidEmailErrorFn = function (value) {
        return function () {
            const user = generator.newUser();
            if (value === '--') {
                delete user.email;
            } else {
                user.email = value;
            }
            return models.user.createUser(user)
                .then(shared.throwingHandler, err => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['--', 'no'],
        ['', 'empty'],
        ['notemail', 'invalid (no @) ']
    ].forEach(([value, msg]) => {
        it(`error: create user with ${msg} email`, invalidEmailErrorFn(value));
    });

    const invalidEmailUpdateErrorFn = function (value) {
        return function () {
            const id = hxUser.id(0);
            return models.user.updateUser(id, { email: value })
                .then(shared.throwingHandler, err => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['', 'empty'],
        ['notemail', 'invalid (no @)']
    ].forEach(([value, msg]) => {
        it(`error: update user with ${msg} email`, invalidEmailUpdateErrorFn(value));
    });

    const oldPasswords = new Array(userCount);
    const tokens = new Array(userCount);

    const resetPasswordTokenFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            oldPasswords[index] = client.password;
            return models.user.resetPasswordToken(client.email)
                .then(token => {
                    expect(!!token).to.equal(true);
                    tokens[index] = token;
                });
        };
    };

    const authenticateUserOldPWFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            return models.user.authenticateUser(client.username, oldPasswords[index])
                .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'));
        };
    };

    const resetPasswordWrongTokenFn = function (index) {
        return function () {
            const token = tokens[index];
            const wrongToken = (token.charAt(0) === '1' ? '2' : '1') + token.slice(1);
            return models.user.resetPassword(wrongToken, 'newPassword')
                .then(shared.throwingHandler, shared.expectedErrorHandler('invalidOrExpiredPWToken'));
        };
    };

    const resetPasswordFn = function (index) {
        return function () {
            const token = tokens[index];
            const password = generator.newUser().password;
            hxUser.client(index).password = password;
            return models.user.resetPassword(token, password);
        };
    };

    _.range(userCount).forEach(index => {
        it(`get reset password token for user ${index}`, resetPasswordTokenFn(index));
        it(`error: authenticate user ${index} with old password`, authenticateUserOldPWFn(index));
        it(`error: reset password with wrong token for user ${index}`, resetPasswordWrongTokenFn(index));
        it(`reset password for user ${index}`, resetPasswordFn(index));
        it(`authenticate user ${index}`, authenticateUserFn(index));
    });

    it('error: reset password token for invalid email', function () {
        return models.user.resetPasswordToken('a@a.com')
            .then(shared.throwingHandler, shared.expectedErrorHandler('invalidEmail'));
    });

    it('error: reset password with expired reset token', function () {
        const stub = sinon.stub(config, 'expiresForDB', function () {
            let m = moment.utc();
            m.add(250, 'ms');
            return m.toISOString();
        });
        const inputUser = generator.newUser();
        return models.user.createUser(inputUser)
            .then(user => models.user.resetPasswordToken(user.email))
            .then(function (token) {
                return models.user.resetPassword(token, 'newPassword')
                    .then(() => SPromise.delay(600))
                    .then(() => models.user.resetPassword(token, 'newPassword'))
                    .then(shared.throwingHandler, shared.expectedErrorHandler('invalidOrExpiredPWToken'))
                    .then(() => {
                        expect(stub.called).to.equal(true);
                        config.expiresForDB.restore();
                    });
            });
    });
});
